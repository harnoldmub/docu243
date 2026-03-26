async function fetchDossier() {
  const loginRes = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@docu243.cd", password: "admin123" })
  });
  
  const cookie = loginRes.headers.get('set-cookie');
  console.log("Logged in, Cookie:", cookie);
  
  const res = await fetch("http://localhost:3001/api/applications/2cf16c53-6235-43cd-9df1-b7dfe86987f9", {
    headers: { "Cookie": cookie }
  });
  
  const json = await res.json();
  console.log(JSON.stringify(json.procedure?.fields, null, 2));
}

fetchDossier().catch(console.error);
