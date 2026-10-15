.PHONY: install dev build test lint typecheck format db-up db-down

install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm test

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
