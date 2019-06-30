var fs = require('fs');
var express = require('express');
var hbs = require('hbs');
var path = require('path');
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var session = require('express-session')
var memoryStore = require('memorystore')(session)
const bcrypt = require('bcrypt');

const Usuario = require('./modelos/usuario');
const Curso = require('./modelos/curso');
const Inscripcion = require('./modelos/inscripcion');

var app = express();

app.use(session({
    cookie: { maxAge: 86400000 },
    store: new memoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

hbs.registerPartial('menu', fs.readFileSync(__dirname + '/vistas/menu.hbs', 'utf8'));
hbs.registerPartial('css_javascript', fs.readFileSync(__dirname + '/vistas/css_javascript.hbs', 'utf8'));

app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

hbs.registerHelper('ifNotEquals', function(arg1, arg2, options) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});

app.post('/iniciar-sesion', function (req, res) {
    Usuario.findOne({correo : req.body.correo}, (err, resultados) => {
        if (err){
            return console.log(err)
        }
        if(!resultados){
            return res.render (path.join(__dirname + '/vistas/iniciar-sesion.hbs'), {
                error: true
            });
        }
        if(!bcrypt.compareSync(req.body.password, resultados.password)){
            res.render (path.join(__dirname + '/vistas/iniciar-sesion.hbs'), {
                error: true
            });
        }
        req.session.id = resultados._id;
        req.session.correo = resultados.correo;
        req.session.documento = resultados.documento;
        req.session.nombre = resultados.nombre;
        req.session.tipo = resultados.tipo;
        res.redirect('/cursos');
    });
});

app.get('/', function (req, res) {
    res.render(path.join(__dirname + '/vistas/iniciar-sesion.hbs'));
});

app.post('/registrarse', function (req, res) {
    let usuario = new Usuario ({
        nombre : req.body.nombre,
        documento : req.body.documento,
        telefono : req.body.telefono,
        correo : 	req.body.correo,
        password : bcrypt.hashSync(req.body.password, 10)
    });

    Usuario.find({documento: req.body.documento},(err, docs)=>{
        if (err){
            return console.log(err)
        }
        if(docs.length){
            res.render(path.join(__dirname + '/vistas/registrarse.hbs'), {
                error: true
            });
        }
        else{
            usuario.save((err, resultado) => {
                if (err){
                    res.render(path.join(__dirname + '/vistas/registrarse.hbs'), {
                        error: true
                    });
                }
                res.render(path.join(__dirname + '/vistas/iniciar-sesion.hbs'), {
                    msg: true,
                    msgCreacion: true
                });
            })
        }
    });


});

app.get('/registrarse', function (req, res) {
    return res.render(path.join(__dirname + '/vistas/registrarse.hbs'));
});

app.get('/cursos', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }

    return res.render(path.join(__dirname + '/vistas/cursos.hbs'),
        {
            nombre: req.session.nombre,
            correo: req.session.correo,
            tipoUsuario: req.session.tipo
        }
    );
});

app.get('/listar-cursos', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    var cursos = {};
    if(req.session.tipo == 'aspirante'){
        cursos = Curso.find({estado: 'disponible'},(err, result)=>{
            if (err){
                return console.log(err)
            }

            return res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'), {
                cursos: result,
                tipoUsuario: req.session.tipo
            });
        });
    }
    else if(req.session.tipo == 'coordinador'){
        cursos = Curso.find({},(err, result)=>{
            if (err){
                return console.log(err)
            }

            return res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'), {
                cursos: result,
                tipoUsuario: req.session.tipo
            });
        });
    }else{
        return res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'), {
            cursos: cursos,
            tipoUsuario: req.session.tipo
        });
    }
});

app.get('/crear-cursos', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'), {
        tipoUsuario: req.session.tipo
    });
});

app.post('/guardar-cursos', function (req, res) {
    const body = req.body;
    Curso.find({idCurso: body['idCurso']},(err, docs)=>{
        if (err){
            return console.log(err)
        }

        if (docs.length){
            return res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'),
            {
                existeCurso: true,
                guardado: false,
                tipoUsuario: req.session.tipo
            });
        }else{
            var curso = new Curso({
                idCurso: body['idCurso'],
                nombre: body['nombre'],
                descripcion: body['descripcion'],
                valor: body['valor'],
                intensidad: body['intensidadHoraria'],
                modalidad: body['modalidad'],
                estado: 'disponible',
            });
            curso.save((err, resultado) => {
                if (err){
                    return res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'),
                    {
                        existeCurso: false,
                        guardado: false,
                        tipoUsuario: req.session.tipo
                    });
                }
                return res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'),
                {
                    existeCurso: false,
                    guardado: true,
                    tipoUsuario: req.session.tipo
                });
            })
        }
    });
});

app.get('/ver-curso/:id', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    Curso.findOne({idCurso: req.params.id},(err, curso)=>{
        res.render(path.join(__dirname + '/vistas/ver-curso.hbs'), {
            curso: curso,
            tipoUsuario: req.session.tipo
        });
    });
});

app.get('/cerrar-sesion/', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    req.session.destroy((err) => {
        if (err) return console.log(err)
    })
    res.redirect('/');
});

app.get('/proceso-inscripcion/', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    Curso.find({estado: 'disponible'},(err, docs)=>{
        if (err){
            return console.log(err)
        }
        Usuario.findOne({documento: req.session.documento},(er, usuario)=> {
            if (err){
                return console.log(err)
            }
            return res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'), {
                cursos: docs,
                usuario: usuario,
                tipoUsuario: req.session.tipo
            });
        });
    });
});

app.post('/guardar-proceso-inscripcion/', function (req, res) {
    Inscripcion.find({idCurso: req.body.idCurso, documento: req.body.documento},(err, inscritos)=> {
        if (err){
            return console.log(err)
        }
        if(inscritos.length){
            Curso.find({},(err, cursos)=> {
                Usuario.findOne({documento: req.session.documento},(er, usuario)=> {
                    return res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'), {
                        existeUsuarioCurso: true,
                        cursos: cursos,
                        usuario: usuario,
                        tipoUsuario: req.session.tipo
                    });
                });
            });
        }
        else{
            let inscripcion = new Inscripcion({
                idCurso: req.body.idCurso,
                documento: req.body.documento,
                telefono: req.body.telefono,
                nombre: req.body.nombre,
                correo: req.body.correo
            });
            inscripcion.save((err, insc) => {
                if (err){
                    return res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'), {
                        error: true,
                        tipoUsuario: req.session.tipo
                    });
                }
                else{
                    Curso.find({},(err, cursos)=> {
                        return res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'), {
                            cursos: cursos,
                            guardado: true,
                            tipoUsuario: req.session.tipo
                        });
                    });
                }
            })
        }
    });
});

app.get('/ver-inscritos', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    Curso.find({},(err, cursos)=> {
        Inscripcion.find({},(err, inscritos)=> {
            Usuario.find({},(err, usuarios)=> {
                return res.render(path.join(__dirname + '/vistas/ver-inscritos.hbs'),
                    {
                        cursos: cursos,
                        usuarios: usuarios,
                        inscritos: inscritos,
                        tipoUsuario: req.session.tipo
                    }
                );
            });
        });
    });
});

app.post('/cambiar-estado-curso', function (req, res) {
    const body = req.body;
    var idCurso = body.idCurso;

    Curso.findOne({ idCurso: idCurso }, function (er, row) {
        row.estado = 'cerrado';
        row.save(function(er) {
            if(!er) {
                Curso.find({},(err, cursos)=> {
                    Inscripcion.find({},(err, inscritos)=> {
                        Usuario.find({},(err, usuarios)=> {
                            res.locals = {
                                cursos: cursos,
                                cerrado: true,
                                inscritos: inscritos,
                                usuarios: usuarios
                            };
                            return res.render(path.join(__dirname + '/vistas/ver-inscritos.hbs'), {
                                tipoUsuario: req.session.tipo
                            });
                        });
                    });
                });
            }
        });
    });
});

app.get('/eliminar-inscritos', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    Curso.find({},(err, cursos)=> {
        Inscripcion.find({},(err, inscritos)=> {
            Usuario.find({},(err, usuarios)=> {
                return res.render(path.join(__dirname + '/vistas/eliminar-inscritos.hbs'),
                    {
                        cursos: cursos,
                        usuarios: usuarios,
                        inscritos: inscritos,
                        tipoUsuario: req.session.tipo
                    }
                );
            });
        });
    });
});

app.get('/eliminar-inscripcion/:idCurso/:documento', function (req, res) {
    if(! req.session.correo){
        return res.redirect('/');
    }
    Inscripcion.deleteOne({documento: req.params.documento, idCurso: req.params.idCurso}, (err, docs) => {
        Curso.find({},(err, cursos)=> {
            Inscripcion.find({},(err, inscritos)=> {
                Usuario.find({},(err, usuarios)=> {
                    return res.render(path.join(__dirname + '/vistas/eliminar-inscritos.hbs'),
                        {
                            cursos: cursos,
                            usuarios: usuarios,
                            inscritos: inscritos,
                            tipoUsuario: req.session.tipo
                        }
                    );
                });
            });
        });
    });
});

app.listen(process.env.PORT || 3000, function () {
    mongoose.connect((process.env.MONGODB_URI ? process.env.MONGODB_URI : "mongodb://localhost:27017/cursos"),
        {useNewUrlParser: true}, (err, resultado) => {
        if (err) {
            return console.log(error)
        }
        Usuario.find({correo : "coordinador@myapp.com"}, (err, resultados) => {
            if(! resultados.length){
                    coordinador = new Usuario({
                    tipo: "coordinador",
                    nombre: "Coordinador",
                    documento: "12345678",
                    telefono: "1234567",
                    correo: "coordinador@myapp.com",
                    password: "$2b$10$972PVYdXzzWZUOLnlgdlOuMoDV2n2U4Cm2waiBR1AS4Egf4Tq3U7S" // 123456
                });
                coordinador.save();
            }

        });
    });
});



