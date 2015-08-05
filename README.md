File Browser
============

Shows a hierarchy of documents, based on the slashes in their filenames.

This is a plugin for Overview. You can see it live on
https://www.overviewdocs.com.

To run with your local Overview install:

    git clone https://github.com/overview/overview-file-browser.git
    cd overview-file-browser
    npm install --production
    npm start
  
You can then create a word cloud using the "Custom..." option in Overview's
New View menu. Enter ``http://localhost:3000`` as the URL.

Development
-----------

1. `npm install`
2. `node-dev ./server.js` to run the server
3. `gulp dev` to recompile client-side JavaScript on change
4. `npm test` to run tests (in a PhantomJS browser)
5. `gulp dist` to write client-side files to `dist/` (which you should commit)

License
-------

This project is copyright Overview Services Inc. and released under the
AGPL-3.0 open source license. See LICENSE for legal prose.
