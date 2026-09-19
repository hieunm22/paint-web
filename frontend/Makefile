# deploy targets, run from frontend/. the workflows in .github/ call publish-sync.
IMAGE := paint-web
CONTAINER := paint-web
PORT := 3004

.PHONY: install build destroy publish publish-sync logs restart

install:
	yarn install

build:
	yarn build

# an image still in use cannot be removed, so the container goes first
destroy:
	@if docker ps -a --format '{{.Names}}' | grep -qw $(CONTAINER); then \
		echo "container $(CONTAINER) exists, destroying..."; \
		docker container stop $(CONTAINER); \
		docker container rm $(CONTAINER); \
		docker image rm $(IMAGE); \
		echo "container $(CONTAINER) destroyed."; \
	else \
		echo "container $(CONTAINER) does not exist, skipping destroy."; \
	fi

# dist is copied into the image, nothing on the host reads it afterwards
publish:
	docker build --progress=plain -t $(IMAGE) -f Dockerfile .
	docker run --name $(CONTAINER) -ditp $(PORT):80 --restart unless-stopped $(IMAGE)
	rm -rf dist

publish-sync: build destroy publish

restart:
	docker container restart $(CONTAINER)

logs:
	docker logs -f --tail 200 $(CONTAINER)
