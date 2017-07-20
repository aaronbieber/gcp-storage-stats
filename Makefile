.PHONY: dev deploy build decrypt

build:
	yarn
	gpg -c node_modules/app/secrets/secrets.json && rm node_modules/app/secrets/secrets.json

decrypt:
	gpg node_modules/app/secrets/secrets.json.gpg

dev: decrypt
	yarn dev

deploy: decrypt
	gcloud app deploy
