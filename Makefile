# deploy targets, run from the repo root. the workflows in .github/ call publish-sync.
IMAGE := paint-web
CONTAINER := paint-web
PORT := 3004

.PHONY: install build destroy publish publish-sync logs restart

install:
	yarn install

build:
	yarn build

# an image still in use cannot be removed, so the container goes first. the
# name filter is anchored: a bare match also hits paint-web-anything.
destroy:
	@if [ -n "$$(docker ps -aq -f name=^$(CONTAINER)$$)" ]; then \
		echo "container $(CONTAINER) exists, destroying..."; \
		docker container stop $(CONTAINER); \
		docker container rm $(CONTAINER); \
		echo "container $(CONTAINER) destroyed."; \
	else \
		echo "container $(CONTAINER) does not exist, skipping destroy."; \
	fi
	docker image rm $(IMAGE); \

kill:
	lsof -ti :3004 | xargs kill -9

# dist is copied into the image, nothing on the host reads it afterwards
docker:
	docker build --progress=plain -t $(IMAGE) -f Dockerfile .
	docker run --name $(CONTAINER) -ditp $(PORT):80 --restart unless-stopped $(IMAGE)
	rm -rf dist

# destroy is a prerequisite rather than a recipe line: make then runs it once,
# whether publish was asked for on its own or through publish-sync
publish: destroy
	docker build --progress=plain -t $(IMAGE) -f Dockerfile .
	docker run --name $(CONTAINER) -ditp $(PORT):80 --restart unless-stopped $(IMAGE)

publish-sync: build publish

restart:
	docker container restart $(CONTAINER)

logs:
	docker logs -f --tail 200 $(CONTAINER)
