.PHONY: dev deploy build decrypt todo

build:
	yarn
	gpg -c node_modules/app/secrets/secrets.json && rm node_modules/app/secrets/secrets.json

decrypt:
	stat node_modules/app/secrets/secrets.json >/dev/null 2>&1 || \
	gpg node_modules/app/secrets/secrets.json.gpg

dev: decrypt
	yarn dev

todo:
	! grep -Ri @todo index.js node_modules/app routes

deploy: decrypt todo
	cp -R node_modules/app app_modules
	gcloud app deploy
	rm -rf app_modules
