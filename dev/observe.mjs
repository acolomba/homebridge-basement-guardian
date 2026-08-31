// Dumps the live HAP accessory database from the running dev bridge.
//
// This is the real accessory database from a real Homebridge process, so it
// shows exactly what a controller sees -- including StatusActive, which Apple
// Home only surfaces under accessory Details. Requires BG_INSECURE=1.
const PORT = process.env.BG_BRIDGE_PORT ?? '51826';
const filter = process.argv[2];

let accessories;
try {
  ({ accessories } = await (await fetch(`http://127.0.0.1:${PORT}/accessories`)).json());
} catch {
  console.error(`No HAP response on 127.0.0.1:${PORT}. Is the container up, and is BG_INSECURE=1?`);
  process.exit(1);
}

for (const accessory of accessories) {
  const info = accessory.services.find((service) => service.type === '3E');
  const name = info?.characteristics.find((c) => c.description === 'Name')?.value;
  if (name === 'Homebridge') {
    continue;
  }

  const rows = accessory.services
    .filter((service) => service.type !== '3E' && service.type !== 'A2')
    .map((service) => ({
      name: service.characteristics.find((c) => c.description === 'Name')?.value ?? `(${service.type})`,
      values: service.characteristics
        .filter((c) => c.description !== 'Name' && c.value !== undefined)
        .map((c) => `${c.description}=${JSON.stringify(c.value)}`),
    }))
    .filter((row) => !filter || String(row.name).toLowerCase().includes(filter.toLowerCase()));

  if (rows.length === 0) {
    continue;
  }

  console.log(`\n=== ${name} -- ${rows.length} services ===`);
  for (const row of rows) {
    const inactive = row.values.includes('Status Active=false') || row.values.includes('Status Active=0');
    console.log(`${String(row.name).padEnd(26)} ${row.values.join('  ')}${inactive ? '  <-- INACTIVE' : ''}`);
  }
}
