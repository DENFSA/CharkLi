"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const login_1 = require("./view/login");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.urlencoded({ extended: true }));
// static
app.use(express_1.default.static(path_1.default.resolve("public")));
app.use(express_1.default.static(path_1.default.resolve("dist")));
app.get("/", (_req, res) => res.redirect("/login"));
app.get("/login", (req, res) => {
    const error = typeof req.query.error === "string" ? req.query.error : "";
    res.send((0, login_1.renderLogin)({ error }));
});
app.post("/login", (req, res) => {
    const email = String(req.body.email ?? "");
    const password = String(req.body.password ?? "");
    if (email === "demo@dnd.ua" && password === "demo") {
        // TODO: when we build page 2, replace this with: res.redirect("/characters");
        return res.send((0, login_1.renderLogin)({ error: "OK ✅ (далі зробимо /characters)" }));
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
