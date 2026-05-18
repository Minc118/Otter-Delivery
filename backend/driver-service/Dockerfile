FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum* ./
COPY cmd ./cmd
COPY internal ./internal

RUN go build -o /driver-service ./cmd/server

FROM alpine:3.20

WORKDIR /app
COPY --from=builder /driver-service /app/driver-service

EXPOSE 8003
ENV PORT=8003
ENV ETA_MINUTES=40

CMD ["/app/driver-service"]
