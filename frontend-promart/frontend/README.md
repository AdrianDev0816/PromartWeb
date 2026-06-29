# 📘 Reglas de Desarrollo del Sistema

> Documento oficial para todos los integrantes del equipo. Leer antes de comenzar a trabajar en el proyecto.

---

## 🎯 Objetivo

Mantener el proyecto organizado, evitar conflictos entre ramas y garantizar que el sistema siempre tenga una versión estable disponible.

---

## 🌿 Estructura de Ramas

| Rama |           Propósito                       | ¿Quién trabaja aquí? |
|------|-------------------------------------------|----------------------|
| `main` | Versión estable y funcional del sistema | Nadie directamente |
| `develop` | Integración del trabajo de todo el equipo | Todos (solo via merge) |
| `feature/nombre` | Desarrollo individual de cada funcionalidad | Cada integrante en su propia rama |

### Ejemplos de ramas feature

| Integrante | Rama asignada |
|------------|---------------|
| Módulo Login | `feature/login` |
| Módulo Productos | `feature/productos` |
| Módulo Clientes | `feature/clientes` |
| Módulo Ventas | `feature/ventas` |

---

## 📋 Reglas Obligatorias

### Regla 1 — No trabajar directamente en `main`

> ⛔ **La rama `main` es únicamente para versiones estables y aprobadas por el equipo.**

```bash
# ❌ NUNCA hagas esto
git checkout main
git commit -m "mi cambio"
```

---

### Regla 2 — Actualizar `develop` antes de trabajar

Antes de iniciar cualquier trabajo del día, sincroniza tu rama con los últimos cambios:

```bash
git checkout develop
git pull origin develop
```

---

### Regla 3 — Crear ramas siempre desde `develop`

```bash
# Ejemplo para el módulo de login
git checkout develop
git checkout -b feature/login
```

---

### Regla 4 — Commits claros y descriptivos

|    ✅ Correcto                             | ❌ Incorrecto |
|--------------------------------------------|---------------|
| `git commit -m "Implementa login con JWT"` | `git commit -m "cambios"` |
| `git commit -m "Agrega CRUD de productos"` | `git commit -m "arreglé cosas"` |
| `git commit -m "Corrige validación de formulario de clientes"` | `git commit -m "fix"` |

---

### Regla 5 — Verificar que el proyecto funcione antes de subir

Antes de hacer `push`, asegúrate de que el proyecto compila y corre correctamente:

**Backend (Spring Boot / Maven):**
```bash
mvn clean install
```

**Frontend (Angular):**
```bash
ng serve
```

> ⚠️ Si alguno de los dos falla, **no subas los cambios** hasta resolverlo.

---

### Regla 6 — Subir cambios solo a tu rama personal

```bash
# Ejemplo para quien trabaja en feature/login
git push origin feature/login
```

> ✅ Nunca hagas push directo a `develop` ni a `main`.

---

## 🔄 Flujo de Trabajo Resumido

```
develop (actualizado)
    │
    ├──► git checkout -b feature/mi-modulo
    │
    │    [trabajas y haces commits]
    │
    ├──► git push origin feature/mi-modulo
    │
    └──► Pull Request hacia develop (lo revisa el equipo)
```

---

## ✅ Checklist antes de cada push

- [ ] Hice `git pull origin develop` al inicio del día
- [ ] Estoy trabajando en mi rama `feature/...` y no en `develop` o `main`
- [ ] El backend compila con `mvn clean install`
- [ ] El frontend corre con `ng serve`
- [ ] Mis commits tienen mensajes claros y descriptivos
- [ ] Hago push solo a mi rama personal

---

> 📌 **Cualquier duda, coordinar con el equipo antes de hacer merge a `develop`.**

## PASOS PARA LEVANTAR EL RPOYECTO BACKEND/FRONT:

Se va utilizar el docker como herramienta de contenedor para levantar el proyecto ambos ambientes y se va alojar tmb la conexion con mysql a la base de datos del proyecto.

Comandos:

# 1. Clonar el repositorio
git clone <url-del-repo>

# 2. Entrar a la carpeta raíz
cd Sistema-promart

# 3. Levantar todo
docker compose up --build
Listo. Abrir http://localhost:4200

Qué hace Docker automáticamente
Descarga MySQL 8
Instala dependencias npm del frontend
Compila Angular en producción
Descarga dependencias Maven del backend
Compila Spring Boot
Crea las tablas en la base de datos
Conecta los 3 servicios entre sí
Único requisito
Tener Docker Desktop instalado y corriendo en el dispositivo.
