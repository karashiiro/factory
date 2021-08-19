SHELL := /bin/bash
.DEFAULT_GOAL := help 

help: ## Show this help
	@echo Dependencies: deno [docker-compose aws]
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

run: ## Run the development server
	@deno run --allow-net --allow-run --allow-read --unstable --import-map import_map.json app.ts

build: ## Build the website for production
	@deno run --allow-net --allow-run --allow-read --allow-write --unstable --import-map import_map.json build.ts

localstack-start: ## Start the Localstack server for deployment testing (requires docker-compose)
	@docker-compose up -d

localstack-stop: ## Stop a running Localstack server (requires docker-compose)
	@docker-compose down

deploy-dev: ## Deploy a built website to a running Localstack server (requires aws)
	-@aws --endpoint-url=http://localhost:4566 s3 mb s3://factory
	@aws --endpoint-url=http://localhost:4566 s3 cp ./dist s3://factory --recursive