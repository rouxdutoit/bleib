"""Fit two independent linear heads from frozen, locally encoded synthetic text."""

import csv
import sys
import json
from pathlib import Path

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper
from scipy.sparse import csr_matrix
from sklearn.linear_model import LogisticRegression

CACHE = Path(".cache/q2")
with Path(__file__).with_name("slots.tsv").open(encoding="utf-8") as file:
    SLOTS = [row["id"] for row in csv.DictReader(file, delimiter="\t")]


def export(weights, bias, path, static):
    """Quantize per output column and accumulate the int8 weights in int32."""
    scales = (np.abs(weights).max(axis=0) / 127).astype(np.float32)
    quantized = np.clip(np.rint(weights / scales), -127, 127).astype(np.int8)
    constants = {
        "weights": quantized,
        "weight_scale": scales,
        "weight_zero": np.zeros(len(SLOTS), dtype=np.int8),
        "bias": bias.astype(np.float32),
    }
    nodes = [
        helper.make_node("DynamicQuantizeLinear", ["embedding"], ["input_quant", "input_scale", "input_zero"]),
        helper.make_node("MatMulInteger", ["input_quant", "weights", "input_zero", "weight_zero"], ["accumulator"]),
        helper.make_node("Cast", ["accumulator"], ["float_acc"], to=TensorProto.FLOAT),
        helper.make_node("Mul", ["input_scale", "weight_scale"], ["scale"]),
        helper.make_node("Mul", ["float_acc", "scale"], ["dequantized"]),
        helper.make_node("Add", ["dequantized", "bias"], ["logits"]),
        helper.make_node("Sigmoid", ["logits"], ["scores"]),
    ]
    graph = helper.make_graph(
        nodes, "bleib-slot-head",
        [helper.make_tensor_value_info("embedding", TensorProto.FLOAT, [1, weights.shape[0]])],
        [helper.make_tensor_value_info("scores", TensorProto.FLOAT, [1, len(SLOTS)])],
        [numpy_helper.from_array(value, name) for name, value in constants.items()],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 21)], ir_version=10)
    onnx.checker.check_model(model, full_check=True)
    onnx.save(model, path)
    if static:
        with path.with_suffix(".bin").open("wb") as file:
            file.write(scales.astype("<f4").tobytes())
            file.write(constants["bias"].astype("<f4").tobytes())
            file.write(quantized.tobytes())


def fit(mode, static):
    rows = json.loads((CACHE / f"{mode}-train.json").read_text(encoding="utf-8"))
    if static:
        data = json.loads((CACHE / f"{mode}-static.json").read_text(encoding="utf-8"))
        embeddings = csr_matrix(
            (data["values"], data["indices"], data["offsets"]), shape=(len(rows), 8192), dtype=np.float32,
        )
    else:
        embeddings = np.fromfile(CACHE / f"{mode}-train.f32", dtype="<f4").reshape(len(rows), -1)
    weights = []
    biases = []
    for slot in SLOTS:
        y = [slot in row["labels"] for row in rows]
        classifier = LogisticRegression(C=12, class_weight="balanced", max_iter=1000, tol=1e-5)
        classifier.fit(embeddings, y)
        weights.append(classifier.coef_[0])
        biases.append(classifier.intercept_[0])
    suffix = "static" if static else "int8"
    path = CACHE / f"{mode}-{suffix}.onnx"
    export(np.stack(weights, axis=1), np.array(biases), path, static)
    print(f"{mode}: {len(rows)} texts, {embeddings.shape[1]} features, {len(SLOTS)} labels, {path.stat().st_size} bytes")


if __name__ == "__main__":
    for name in ["request", "save"]:
        fit(name, "--static" in sys.argv[1:])
