class DBRouter:
    mongo_models =  {'doctree', 'pagenode'}
    

    def db_for_read(self, model, **hints):
        if model._meta.model_name in self.mongo_models:
            return 'tree_db'
        return 'default'
    
    def db_for_write(self, model, **hints):
        if model._meta.model_name in self.mongo_models:
            return 'tree_db'
        return 'default'

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if db == 'tree_db':
            print(model_name , db )
            return model_name in self.mongo_models

        if db == 'default':
            return model_name not in self.mongo_models
        return None