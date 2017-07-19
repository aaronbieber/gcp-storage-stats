.PHONY: dev deploy

dev:
	yarn dev

deploy:
	gpg secrets.json.gpg
	gcloud app deploy
