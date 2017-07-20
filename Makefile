.PHONY: dev deploy build decrypt

build:
	yarn
	gpg -c node_modules/app/secrets/secrets.json && rm node_modules/app/secrets/secrets.json

decrypt:
	stat node_modules/app/secrets/secrets.json >/dev/null 2>&1 || \
	gpg node_modules/app/secrets/secrets.json.gpg

dev: decrypt
	yarn dev

deploy: decrypt
	cp -R node_modules/app app_modules
	gcloud app deploy
	rm -rf app_modules
