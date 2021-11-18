SHELL := /bin/bash
.DEFAULT_GOAL := help 

help: ## Show this help
	@echo Dependencies: deno [docker-compose aws]
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

run: ## Run the development server
	@deno run --allow-net --allow-run --allow-read --unstable --import-map import_map.json app.ts

build: ## Build the website for production
	@deno run --allow-net --allow-run --allow-read --allow-write --unstable --import-map import_map.json build.ts
