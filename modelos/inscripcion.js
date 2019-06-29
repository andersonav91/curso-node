const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;
const inscripcionSchema = new Schema({
    nombre : {
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
    idCurso :{
        type : String,
        required : true
    },
});

inscripcionSchema.plugin(uniqueValidator);

const Inscripcion = mongoose.model('Inscripcion', inscripcionSchema);

module.exports = Inscripcion
