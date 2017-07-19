.PHONY: dev deploy build decrypt

build:
	yarn
	gpg -c secrets.json && rm secrets.json

decrypt:
	gpg secrets.json.gpg

dev: decrypt
	yarn dev

deploy: decrypt
	gcloud app deploy
