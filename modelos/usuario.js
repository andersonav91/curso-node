const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;
const usuarioSchema = new Schema({
    nombre : {
        type : String,
        required : true	,
        trim : true
    },
    password :{
        type : String,
        required : true
    },
    correo :{
        type : String,
        required : true
    },
    documento :{
        type : String,
        required : true
    },
    telefono :{
        type : String,
        required : true
    },
    tipo :{
        type : String,
        required : true,
        default: 'aspirante'
    }
});

usuarioSchema.plugin(uniqueValidator);

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario
