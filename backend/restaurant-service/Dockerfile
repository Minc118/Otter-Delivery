FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app


COPY pom.xml .
COPY src ./src

#
RUN mvn clean package -DskipTests


FROM eclipse-temurin:17-jre-alpine
WORKDIR /app


RUN addgroup -g 1001 -S spring && adduser -S spring -u 1001 -G spring


COPY --from=build /app/target/restaurant-service-0.0.1-SNAPSHOT.jar ./app.jar


RUN chown spring:spring ./app.jar


USER spring:spring

EXPOSE 8001

ENTRYPOINT ["java","-jar","/app/app.jar"]