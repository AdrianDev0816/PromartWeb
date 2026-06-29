# ─── Stage 1: Compilar con Maven ────────────────────────
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

# Copia el wrapper y el pom primero (caching de dependencias)
COPY .mvn .mvn
COPY mvnw mvnw.cmd pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copia el código fuente y compila
COPY src ./src
RUN ./mvnw package -DskipTests -B

# ─── Stage 2: Imagen de ejecución ───────────────────────
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
