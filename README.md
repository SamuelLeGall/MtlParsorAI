# MtlParsorAI

accessible from https://mtl-parsor-ai.samuel-legall.fr/login

## In DEV Computer

local (with hot-reload) :
- docker version : ./deploy/init_project.sh

local but prod version (build and no hot-reload) :
- docker version : ./deploy/init_project.sh prod

## In PRODUCTION

Deployment possible using the existing jobs in github ci. Everything is automated from build to deployment to the vps
using jobs and github secrets.

## Server install

refer to the following documentation for detail in [this guide](./SERVER_INSTALL.md)


------------------------
## NEXT steps

- Better error handling + work with the errorAI/detail from generateChapter and up
- Make it so that the first 5 chapters of any books have no expiration date on redis
- See we can detect when the browser use auto-translate on the website to alert the user careful you loose the point of the website...
- Start working on the contexte window for gender/preposition + use it in the api call etc (see audio message in phone)
- Give to XXXXXX my prompt for review and upgrade
- Make an export of the redis one way or another ?
- Make the reader config work with new system (the cog setting icon).
- Make UI and backend to add a new book or edit an existing one (except the readerConfig for edit)
- Make UI and backend to add a new BOOKMARK or edit an existing one

- add a form with the error message 'next chapter not found' with an input that have link visited. Then the user can paste a new link instead and load a new text from another website ?
