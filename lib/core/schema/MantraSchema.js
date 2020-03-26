/**
 * Class representing an entity MantraSchema object.
 */
export default class MantraSchema {
    /**
     * Creates a MantraSchema.
     * @param {payload} payload - Contains the name, fields and actions properties.
     */
    constructor({ name, fields, actions, model }) {
        this.name = name;
        this.fields = fields;
        this.actions = actions;
        this.model = model;
    }
};