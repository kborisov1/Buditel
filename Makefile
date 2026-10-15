.PHONY: install dev build test e2e lint typecheck format db-up db-down db-generate db-migrate

install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm test

e2e:
	npm run e2e

typecheck:
	npm run typecheck

lint: typecheck
	npm run lint

format:
	npm run format

db-up:
	docker compose up -d db

db-down:
	docker compose down

db-generate:
	npm run db:generate -w @buditel/core

db-migrate:
	npm run db:migrate -w @buditel/core
