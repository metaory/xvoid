.PHONY: all clean zip release bump

all: release

clean:
	rm -rf dist *.{zip,xpi} web-ext-artifacts

bump:
	jq '.version = (.version | split(".") | .[2]=(.[2]|tonumber+1|tostring) | join("."))' manifest.json > manifest.json.tmp && mv manifest.json.tmp manifest.json

dist: bump
	mkdir -p dist
	cp -r src icons manifest.json dist/

zip: clean dist
	cd dist && zip -r ../xvoid.zip * && zip -r ../xvoid-firefox.xpi * 

release: zip
	@echo "\n📦 Uploading version $$(jq -r .version manifest.json) to Mozilla's servers for signing... (this may take a few minutes)\n"
	web-ext sign --verbose --source-dir dist \
		--api-key=$${AMO_JWT_ISSUER} \
		--api-secret=$${AMO_JWT_SECRET} \
		--channel=unlisted
	@echo "\n✨ Done! Latest signed extension (v$$(jq -r .version manifest.json)):"
	@ls -l web-ext-artifacts/*.xpi | tail -n1
	@ln -sf $$(ls -t web-ext-artifacts/*.xpi | head -n1) latest.xpi
	@echo "\n💫 Symlink created: latest.xpi -> $$(readlink latest.xpi)" 