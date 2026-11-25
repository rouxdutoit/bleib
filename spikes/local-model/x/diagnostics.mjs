const keepPolicy = /BuiltInAI|GenAI|OnDevice|ComponentUpdatesEnabled|ExtensionSettings/u;

async function snapshot(page) {
  return page.locator('body').ariaSnapshot({ timeout: 3000 });
}

async function internals(page) {
  await page.goto('chrome://chrome-urls/');
  const enable = page.getByRole('button', { name: /enable internal debugging pages/iu });
  if (await enable.count()) await enable.click({ timeout: 3000 });
  await page.goto('chrome://on-device-internals/');
  await page.getByText('Loading...', { exact: true }).waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  const info = { tools: await snapshot(page) };
  for (const tab of ['Broker State', 'Event Logs']) {
    const button = page.getByRole('tab', { name: tab });
    if (!await button.count()) continue;
    await button.click({ timeout: 3000 });
    // The broker tables are populated by an asynchronous Mojo response.
    await page.waitForTimeout(800);
    info[tab] = (await snapshot(page)).slice(0, 18_000);
  }
  return info;
}

async function policies(page) {
  await page.goto('chrome://policy/');
  await page.getByText('Chrome Policies', { exact: true }).first().waitFor({ timeout: 4000 });
  const text = await snapshot(page);
  const relevant = await page.locator('policy-row').evaluateAll((rows, regex) =>
    rows.map(row => row.shadowRoot?.querySelector('.name-column')?.innerText ?
      row.shadowRoot.querySelector('.name-column').innerText + ' ' + row.shadowRoot.querySelector('.value-column')?.innerText :
      row.shadowRoot?.textContent?.trim().replace(/\s+/g, ' '))
      .filter(row => row && new RegExp(regex).test(row)), keepPolicy.source);
  return { noPoliciesSet: /No policies set/u.test(text), relevant, managed: /browser is managed/iu.test(text) };
}

async function components(page) {
  await page.goto('chrome://components/');
  await page.waitForTimeout(400);
  const lines = (await snapshot(page)).split('\n');
  return lines.filter(line => /Optimization|Gemini|On.?Device/iu.test(line));
}

export async function diagnostics(context) {
  const page = await context.newPage();
  const capture = async fn => {
    try {
      return await fn(page);
    } catch (error) {
      return { error: error.message };
    }
  };
  try {
    return { internals: await capture(internals), policy: await capture(policies),
      components: await capture(components) };
  } finally {
    await page.close();
  }
}

export async function chromeSystem(context) {
  const session = await context.browser().newBrowserCDPSession();
  try {
    const { product: version } = await session.send('Browser.getVersion');
    const { gpu, commandLine } = await session.send('SystemInfo.getInfo');
    return { version, commandLine, gpu: {
      devices: gpu.devices, featureStatus: gpu.featureStatus,
      renderer: gpu.auxAttributes?.glRenderer, implementation: gpu.auxAttributes?.glImplementationParts,
    } };
  } finally {
    await session.detach();
  }
}
