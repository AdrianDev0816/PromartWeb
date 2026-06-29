# 🏠 PromartWeb — Sistema de Gestión de Inventarios

Sistema web de inventario para **PROMART Perú**, desarrollado con Angular + Spring Boot + MySQL, completamente dockerizado.

---

## 🛠️ Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 17 |
| Backend | Spring Boot 3 + Java 17 |
| Base de datos | MySQL 8.0 |
| Contenedores | Docker + Docker Compose |
| Seguridad | JWT (HS256) |

---

## 📋 Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [Git](https://git-scm.com/download/win) instalado

---

## 🚀 Cómo ejecutar el proyecto

### 1. Clonar el repositorio
```bash
git clone https://github.com/AdrianDev0816/PromartWeb.git
cd PromartWeb
```

### 2. Levantar todos los servicios con Docker
```bash
docker-compose up --build
```

### 3. Acceder a la aplicación

| Servicio | URL |
|----------|-----|
| 🌐 Frontend | http://localhost:4200 |
| ⚙️ Backend API | http://localhost:8081 |
| 🗄️ MySQL | localhost:3308 |

> La primera vez tarda unos minutos mientras Docker construye las imágenes.

---

## 📁 Estructura del proyecto

```
PromartWeb/
├── 📁 frontend-promart/            # Aplicación Angular
│   └── frontend/
│       ├── src/
│       ├── Dockerfile
│       └── package.json
├── 📁 backend-promart/             # API Spring Boot
│   ├── src/
│   ├── Dockerfile
│   └── pom.xml
├── 📄 docker-compose.yml           # Orquestación de servicios
├── 📄 Inventario_promart-mysql.sql # Script de base de datos
└── 📄 README.md
```

---

## 🗄️ Base de datos

El script `Inventario_promart-mysql.sql` crea automáticamente:

- **`db_inventario_promart`** — Base de datos principal
- Tablas: `trabajador`, `rol`, `producto`, `proveedor`, `movimientoinventario`, `orden_compra`, `orden_compra_detalle`, `alerta`

Docker importa la base de datos automáticamente al iniciar.

---

## 🔐 Seguridad

- Autenticación mediante **JWT**
- Roles de acceso: `Administrador`, `Supervisor`, `Almacenero`
- Sesión almacenada en `promart_session` / `promart_token`

---

## 🐳 Servicios Docker

| Contenedor | Imagen | Puerto |
|------------|--------|--------|
| `promart-mysql` | mysql:8.0 | 3308:3306 |
| `promart-backend` | Dockerfile propio | 8081:8081 |
| `promart-frontend` | Dockerfile propio | 4200:80 |

---

## 🛑 Detener el proyecto

```bash
docker-compose down
```

Para también eliminar los datos de la base de datos:
```bash
docker-compose down -v
```

---

## 👨‍💻 Autor

**AdrianDev0816**  
GitHub: [@AdrianDev0816](https://github.com/AdrianDev0816)
