export function output(data: unknown, json: boolean): void {
  if (json) console.log(JSON.stringify(data, null, 2));
  else {
    const d = data as any;
    if (d?.ok === false) console.error('Error:', d.error || JSON.stringify(d));
    else console.log(JSON.stringify(data, null, 2));
  }
}
