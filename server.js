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

hbs.registerHelper('obtenerListaInscritos', function(object) {
    var inscritos = JSON.parse(fs.readFileSync('inscritos.json', 'utf8'));
    var usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    inscritos = inscritos.filter(function (item) {
        return item.idCurso === object
    });
    var ret = "<ul class='list-group list-group-flush'>";
    inscritos.forEach(function (it) {
        var usua = usuarios.filter(function (item) {
            return item.documento === it.documento
        });
        usua.forEach(function (i) {
            ret = ret + "<li class='list-group-item'>" + i.nombre + "</li>";
        });
    });
    ret = ret + "</ul>";
    return ret;
  }
);

hbs.registerHelper('obtenerListaInscritosAEliminar', function(object) {
    var inscritos = JSON.parse(fs.readFileSync('inscritos.json', 'utf8'));
    var usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    inscritos = inscritos.filter(function (item) {
        return item.idCurso === object
    });
    var ret = "<ul class='list-group list-group-flush'>";
    inscritos.forEach(function (it) {
        var usua = usuarios.filter(function (item) {
            return item.documento === it.documento
        });
        usua.forEach(function (i) {
            ret = ret + "<li class='list-group-item'>" + i.nombre
                + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
                "<a class='btn btn-primary btn-sm' href='/eliminar-inscripcion/" + object + "/" + i.documento + "' role='button'>Eliminar</a>"
                + "</li>";
        });
    });
    ret = ret + "</ul>";
    return ret;
    }
);

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
    return res.render(path.join(__dirname + '/vistas/cursos.hbs'),
        {
            nombre: req.session.nombre,
            correo: req.session.correo
        }
    );
});

app.get('/listar-cursos', function (req, res) {
    var cursos = {};
    if(req.session.tipo == 'aspirante'){
        cursos = Curso.find({estado: 'disponible'},(err, result)=>{
            if (err){
                return console.log(err)
            }

            return res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'), {
                cursos: result
            });
        });
    }
    else if(req.session.tipo == 'coordinador'){
        cursos = Curso.find({},(err, result)=>{
            if (err){
                return console.log(err)
            }

            return res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'), {
                cursos: result
            });
        });
    }else{
        return res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'), {
            cursos: cursos
        });
    }
});

app.get('/crear-cursos', function (req, res) {
    res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'));
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
                guardado: false
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
                        guardado: false
                    });
                }
                return res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'),
                {
                    existeCurso: false,
                    guardado: true
                });
            })
        }
    });
});

app.get('/ver-curso/:id', function (req, res) {
    Curso.findOne({idCurso: req.params.id},(err, curso)=>{
        res.render(path.join(__dirname + '/vistas/ver-curso.hbs'), {curso: curso});
    });
});

app.get('/cerrar-sesion/', function (req, res) {
    req.session.destroy((err) => {
        if (err) return console.log(err)
    })
    res.redirect('/');
});

app.get('/proceso-inscripcion/', function (req, res) {
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
                usuario: usuario
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
                        usuario: usuario
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
                        error: true
                    });
                }
                else{
                    Curso.find({},(err, cursos)=> {
                        return res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'), {
                            cursos: cursos,
                            guardado: true,
                        });
                    });
                }
            })
        }
    });
});

app.get('/ver-inscritos', function (req, res) {
    var todosCursos = [];
    Curso.find({estado: 'disponible'},(err, cursos)=> {
        Inscripcion.find({},(err, inscritos)=> {
            Usuario.find({},(err, usuarios)=> {
                return res.render(path.join(__dirname + '/vistas/ver-inscritos.hbs'),
                    {
                        cursos: cursos,
                        usuarios: usuarios,
                        inscritos: inscritos
                    }
                );
            });
        });
    });
});













app.get('/eliminar-inscritos', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    var inscritos = JSON.parse(fs.readFileSync('inscritos.json', 'utf8'));
    var usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
        inscritos: inscritos,
        usuarios: usuarios
    };
    res.render(path.join(__dirname + '/vistas/eliminar-inscritos.hbs'));
});

app.get('/eliminar-inscripcion/:idCurso/:documento', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    var inscritos = JSON.parse(fs.readFileSync('inscritos.json', 'utf8'));
    var usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    var otrosUsuarios = inscritos.filter(function (item) {
        return item.idCurso != req.params.idCurso || item.documento !== req.params.documento
    });
    escribirArchivo("inscritos.json", otrosUsuarios);
    if(! inscritos.some(function (item) {
        return item.documento === req.params.documento
    })){
        otrosUsuarios = usuarios.filter(function (item) {
            return item.documento !== req.params.documento
        });
        escribirArchivo("usuarios.json", otrosUsuarios);
    }

    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
        inscritos: inscritos,
        usuarios: usuarios
    };
    res.render(path.join(__dirname + '/vistas/eliminar-inscritos.hbs'));
});

app.post('/cambiar-estado-curso', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    var inscritos = JSON.parse(fs.readFileSync('inscritos.json', 'utf8'));
    var usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    const body = req.body;
    var idCurso = body.idCurso;

    cursos[cursos.findIndex(el => el.idCurso === idCurso)].estado = "cerrado";
    escribirArchivo("cursos.json", cursos);

    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
        cerrado: true,
        inscritos: inscritos,
        usuarios: usuarios
    };
    res.render(path.join(__dirname + '/vistas/ver-inscritos.hbs'));
});









app.listen(3000, function () {
    mongoose.connect("mongodb://localhost:27017/cursos", {useNewUrlParser: true}, (err, resultado) => {
        if (err){
            return console.log(error)
        }
        console.log("Conectado a mongo")
    });
});



