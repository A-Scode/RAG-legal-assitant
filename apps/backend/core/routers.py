class DBRouter:

    def db_for_read(self, model, **hints):
        if model._meta.model_name == 'doctree':
            return 'tree_db'
        return 'default'
    
    def db_for_write(self, model, **hints):
        if model._meta.model_name == 'doctree':
            return 'tree_db'
        return 'default'


    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if model_name == 'doctree':
            return db == 'tree_db'
        return db == 'default'