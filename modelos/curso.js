const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;
const cursoSchema = new Schema({
    nombre : {
        type : String,
        required : true	,
        trim : true
    },
    idCurso :{
        type : String,
        required : true
    },
    valor :{
        type : Number,
        required : true
    },
    descripcion :{
        type : String,
        required : true
    },
    intensidad :{
        type : Number,
        required : false
    },
    modalidad :{
        type : String,
        required : false,
        default: 'aspirante'
    },
    estado :{
        type : String,
        required : false,
        default: 'disponible'
    }
});

cursoSchema.plugin(uniqueValidator);

const Curso = mongoose.model('Curso', cursoSchema);

module.exports = Curso
