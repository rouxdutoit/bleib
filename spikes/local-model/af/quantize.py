"""Quantize a verified FP32 ONNX export with ONNX Runtime."""

import sys
from pathlib import Path

import onnx
from onnxruntime.quantization import QuantType, quantize_dynamic
from onnxruntime.quantization.matmul_nbits_quantizer import (
    DefaultWeightOnlyQuantConfig,
    MatMulNBitsQuantizer,
)


def quantize_int8(source, variant):
    suffix = "quantized" if variant == "int8" else "dynamic"
    target = source.with_name(f"model_{suffix}.onnx")
    external = source.with_name(source.name + "_data").exists()
    sidecar = target.with_name(target.name + ".data")
    sidecar.unlink(missing_ok=True)
    quantize_dynamic(
        source, target, op_types_to_quantize=["MatMul", "Gather"],
        per_channel=True, reduce_range=True, weight_type=QuantType.QInt8,
        use_external_data_format=external,
    )
    graph = onnx.load(target, load_external_data=False)
    assert any(node.op_type == "MatMulInteger" for node in graph.graph.node)
    print("Dynamic int8 ONNX", target, target.stat().st_size + (sidecar.stat().st_size if external else 0), "bytes")


def quantize_q4(source):
    target = source.with_name("model_q4.onnx")
    sidecar = target.with_name(target.name + "_data")
    sidecar.unlink(missing_ok=True)
    graph = onnx.load(source)
    if any(opset.domain == "" and opset.version < 21 for opset in graph.opset_import):
        graph = onnx.version_converter.convert_version(graph, 21)
    config = DefaultWeightOnlyQuantConfig(
        block_size=32,
        is_symmetric=True,
        bits=4,
        op_types_to_quantize=("MatMul", "Gather"),
        quant_axes=(("MatMul", 0), ("Gather", 1)),
    )
    quantizer = MatMulNBitsQuantizer(graph, algo_config=config)
    quantizer.process()
    model = quantizer.model.model
    used = {node.op_type for node in model.graph.node}
    assert {"MatMulNBits", "GatherBlockQuantized"}.issubset(used)
    external = source.with_name(source.name + "_data").exists()
    onnx.save_model(model, target, save_as_external_data=external, location=sidecar.name)
    print("4-bit ONNX", target, target.stat().st_size + (sidecar.stat().st_size if external else 0), "bytes")


source = Path(sys.argv[1]) / "onnx" / "model.onnx"
if len(sys.argv) > 2 and sys.argv[2] in {"int8", "dynamic"}:
    quantize_int8(source, sys.argv[2])
else:
    quantize_q4(source)
