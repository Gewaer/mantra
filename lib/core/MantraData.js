import { MantraPlugin } from './../MantraPlugin';
import { MantraComponent, MantraForm } from './components';

/*
    This object contains all the built-in mantra actions.
*/
const DEFAULT_ACTIONS = {
    create: {
        name: 'create',
        needFetch: false
    },
    update: {
        name: 'update',
        needFetch: true
    },
};

/**
 * Class representing a common configuration for MantraComponents.
 */
export default class MantraData {
    /**
     * Creates a MantraData object with default value in properties.
     */
    constructor({ path, baseClass }) {
        this.path = '';
        this.component = {};
        this.parents = [];
        this.name = '';
        this.schema = null;
        this.id = '';
        this.action = '';
        this.context = '';
        this.endpoint = '';
        this._path = path;
        this.alias = '';

        this._setBaseClass(baseClass);
    };

    /**
     * Path to store the state and config resolved from a MantraData
     */
    get storePath() {
        return `states.${this.alias}`;
    }

    /**
     * Path to store the config resolved from a MantraData
     */
    get configPath() {
        return `${this.component._root}.${this.alias}`;
    }

    /**
     * Path to store the state resolved from a MantraData
     */
    get statePath() {
        return `${this.component._root}.${this.alias}.value`;

    }

    /**
     * Path to store the config resolved from a MantraData
     */
    get sourcePath() {
        return `${this.component._root}.${this.alias}.source`;
    }

    /**
     * Evaluate if the class has a model resolved in its component property
     * @returns {Boolean}
     */
    get hasModel() {
        return this.component.hasModel;
    };

    /**
     * Set the class alias property
     * @returns {String} - Alias to identify the data source resolve by the class at the store
     */
    setAlias() {
        this.alias = this.getAlias();
    };

    /**
     * Resolve the class alias property
     * @returns {String} - Alias to identify the data source resolve by the class at the store
     */
    getAlias() {
        if (this.component.model.name) return this.component.model.name;
        return this.endpoint.replace(/\//g, '-');
    };


    get BASE_CLASSES() {
        return {
            MantraComponent,
            MantraForm
        };
    };

    _setBaseClass(baseClass) {
        this._baseClass = this._getBaseClass(baseClass);
    };

    _getBaseClass(baseClass) {
        return this.BASE_CLASSES[baseClass];
    };

    /**
     * Sets the name and schema property to the value of the entity in the _path property.
     * Updates the path property and trimms the _path property.
     */
    setBase() {
        const name = MantraData.getFirstPath(this._path);
        if (!this._isSchema(name)) {
            throw new Error(`The ${name} schema was not found`);
        }

        this._setName(name);
        this._setBaseSchema(name);
        this.updatePath(name);
    };

    /**
     * Sets the class name property to the entity's name.
     * @param {string} name - The entity's name.
     */
    _setName(name) {
        this.name = name;
    };

    /**
     * Verify the existence of the name paramter within the schema in the store.
     * @param {string} name - The name of a possible schema.
     * @returns {boolean} - True if the schema exists in the store.
     */
    _isSchema(name) {
        const schemas = MantraPlugin.getSchemasModule();
        return Object.prototype.hasOwnProperty.call(schemas, name);
    };

    /**
     * Sets the class schema property to the entity's schema object.
     * @param {string} schema - The entity's schema name.
     */
    _setBaseSchema(schema) {
        const schemas = MantraPlugin.getSchemasModule();
        this.schema = schemas[schema];
    };

    /**
     * Set the id property and may re-set the schema, name and id property.
     */
    setRecord() {
        const arrPath = this._path.split('.');

        for (const name of arrPath) {
            if (this._isRelationship(name)) {
                this._setRelationship(name);
                continue;
            }
            
            if (this._isId(name)) {
                this._setId(name);
                continue;
            }

            break;
        }
    };

    /**
     * Verify the existence of the relationship name inside the schema property.
     * @param {string} name - The relationship name to be validated.
     * @returns {boolean} - True if the relationship name exists in the schema property.
     */
    _isRelationship(name) {
        const relationships = this.schema.relationships;
        const HAS_RELATIONSHIPS = (relationships !== undefined);
        return HAS_RELATIONSHIPS && relationships.some((rel) => rel.name === name);;
    };

    /**
     * Re-sets the name, schema and id property.
     * Appends the parentEntity object to the parent property.
     * Updates the path property and trimms the _path property.
     * @param {string} name - The relationship name.
     */
    _setRelationship(name) {
        const parentEntity = { schema: this.schema, name: this.name, id: this.id };
        this._addParent(parentEntity);
        this._setName(name);
        this._setRelationshipSchema(name);
        this._resetId();
        this.updatePath(name);
    };

    /**
     * Set the schema property to the returned relationship.
     * @param {string} name - The relationship name.
     */
    _setRelationshipSchema(name) {
        const relationships = this.schema.relationships;
        this.schema = relationships.find((rel) => rel.name === name);
    };

    /**
     * Verify if the value parameter is a valid id.
     * @param {string} value - The id to be validated.
     * @returns {boolean} - True if the relationship name exists in the schema property.
     */
    _isId(value) {
        const isNull = (value === null);
        const num_value = Number(value);
        const isNaN = Number.isNaN(num_value);
        return !isNaN && !isNull;
    };

    /**
     * Set the id property to the id parameter.
     * Updates the path property and trimms the _path property.
     * @param {string} id - The id value.
     */
    _setId(id) {
        this.id = id;
        this._trimPath(id);
    };

    /**
     * Sets the id property to it's initial value.
     */
    _resetId() {
        this.id = '';
    };

    /**
     * Append the previous entity object to the parents property.
     * @param {string} entity - The previous entity object.
     */
    _addParent(entity) {
        this.parents.push(entity);
    };

    /**
     * Sets the action property to the returned action based on the _path property.
     */
    setAction() {
        this.action = this._getAction();
    };

    /**
     * Gets a custom action or a default action object based on the _path property.
     * @returns {object} - A default or custom action object.
     */
    _getAction() {
        if (this._isCustomAction()) {
            return this._getCustomAction();
        }
        return this._getDefaultAction();
    };

    /**
     * Verify if the first string in the _path parameter is a custom action.
     * @returns {boolean} - True if a custom action matches the action name.
     */
    _isCustomAction() {
        const [action = ''] = this._path.split('.');
        const HAS_ACTIONS = this.schema.actions;
        return HAS_ACTIONS && this.schema.actions.hasOwnProperty(action);
    };

    /**
     * Gets the custom action object that matches the action name.
     * @returns {object} - A custom action object.
     */
    _getCustomAction() {
        const [action = ''] = this._path.split('.');
        return this.schema.actions[action];
    };

    /**
     * Verify if the default action should be the update action.
     * @returns {boolean} - True if the id property is not empty.
     */
    _isUpdateAction() {
        const IS_ID_EMPTY = (this.id !== '');
        return IS_ID_EMPTY;
    };

    /**
     * Gets a default action object based on MantraData's properties.
     * @returns {object} - A built-in Mantra action object.
     */
    _getDefaultAction() {
        if (this._isUpdateAction()) {
            return DEFAULT_ACTIONS.update;
        }
        return DEFAULT_ACTIONS.create;
    };

    /**
     * Sets the component property to the returned component based on the _baseClass property.
     */
    setComponent() {
        this.component = this._baseClass.getComponent(this);
    };

    /**
     * Sets the endpoint property to a string joined by slash.
     */
    setEndpoint() {
        this.endpoint = this.getEndpoint();
        this.setAlias();
    };

    /**
     * Gets a endpoint string action object based on MantraData's properties.
     * @returns {string} - A string concatenated by slash.
     */
    getEndpoint() {
        const allDots = new RegExp('[.]', 'g');
        const endpoint = this.path.replace(allDots, '/');
        return endpoint;
    };

    /**
     * Calls methods to trim the "_path" and append to "path" property.
     * @param {string} path - The path string to be updated and trimmed.
     */
    updatePath(path) {
        this._updatePath(path);
        this._trimPath(path);
    };

    /**
     * Concatanate with a dot the path parameter value to the path property.
     * @param {string} path - The path string to be concatenated.
     */
    _updatePath(path) {
        const IS_PATH_EMPTY = (this.path === '');
        const separator = (IS_PATH_EMPTY) ? '' : '.';
        this.path = this.path.concat(separator, path);
    };

    /**
     * Removes from the _path property the path parameter value.
     * @param {string} path - The path value to remove from the _path property.
     */
    _trimPath(path) {
        const pathWord = new RegExp(`(${path}).?`, 'g');
        this._path = this._path.replace(pathWord, '');
    };

    /**
    * Checks if the config _path property is not empty.
    *
    * @param {MantraData} config - A MantraData object
    * @return {boolean|Error} - True if the path is empty & an error if is not empty.
    */
    isValid() {
        const isEmpty = (this._path === '');
        if (!isEmpty) {
            throw new Error('Configuration path was not completely resolved');
        }
        return true;
    }

    /**
     * Split the path by dots and return the first member.
     * @param {string} path - The path joined by dots.
     * @returns {string} - The first member of the path.
     */
    static getFirstPath(path) {
        return path.split('.')[0];
    };
}