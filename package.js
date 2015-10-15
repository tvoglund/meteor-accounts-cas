Package.describe({
  name: 'tvoglund:meteor-accounts-cas',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'CAS support for accounts',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/tvoglund/meteor-accounts-cas.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use('routepolicy', 'server');
  api.use('webapp', 'server');
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('underscore');

  api.add_files('meteor-accounts-cas-client.js', 'client');
  api.add_files('meteor-accounts-cas-server.js', 'server');
});

Npm.depends({
  cas: "0.0.3",
  "xmldom": "0.1.19",
  "xpath": "0.0.5"
});
