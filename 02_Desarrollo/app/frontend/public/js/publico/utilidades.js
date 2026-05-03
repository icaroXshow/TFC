
export const seleccionar = (selector, contexto = document) => contexto.querySelector(selector);
export const seleccionarTodos = (selector, contexto = document) => Array.from(contexto.querySelectorAll(selector));
export const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080`;
export const CLAVE_AUTH = "kwl_auth";
export const CLAVE_LAVANDERIA_ACTIVA = "kwl_lavanderia_activa";
