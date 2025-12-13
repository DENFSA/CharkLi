import express from "express";
import path from "path";
import { renderLogin } from "./view/login";

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

// static
app.use(express.static(path.resolve("public")));
app.use(express.static(path.resolve("dist")));

app.get("/", (_req, res) => res.redirect("/login"));

app.get("/login", (req, res) => {
  const error = typeof req.query.error === "string" ? req.query.error : "";
  res.send(renderLogin({ error }));
});

app.post("/login", (req, res) => {
  const email = String(req.body.email ?? "");
  const password = String(req.body.password ?? "");

  if (email === "demo@dnd.ua" && password === "demo") {
    // TODO: when we build page 2, replace this with: res.redirect("/characters");
    return res.send(renderLogin({ error: "OK ✅ (далі зробимо /characters)" }));
  }

  return res.redirect("/login?error=" + encodeURIComponent("Невірний email або пароль"));
});

// placeholder for page 2 to avoid 404 while we build it
app.get("/characters", (_req, res) => {
  res.send(`<h1 style="font-family:system-ui;color:#fff;background:#0f1115;padding:24px">Characters page — next step</h1>`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/login`);
});
