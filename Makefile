SHELL := /bin/bash
.DEFAULT_GOAL := help 

help: ## Show this help
	@echo Dependencies: deno
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

run: ## Run the development server
	deno run --allow-net --allow-run --allow-read app.ts