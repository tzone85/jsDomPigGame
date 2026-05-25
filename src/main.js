import "./styles/main.css";
import { PigGame } from "./game/pig-game.js";
import { mount } from "./ui.js";

const root = document.getElementById("app");
if (!root) throw new Error("#app root element missing");
const game = new PigGame();
mount(root, game);
// expose for e2e probing
if (typeof window !== "undefined") window.__pig = game;
