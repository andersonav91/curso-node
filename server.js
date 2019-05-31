var fs = require('fs');
var express = require('express');
var hbs = require('hbs');
var path = require('path');
var bodyParser = require("body-parser");

var app = express();

hbs.registerPartial('menu', fs.readFileSync(__dirname + '/vistas/menu.hbs', 'utf8'));

app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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

app.get('/', function (req, res) {
    res.render(path.join(__dirname + '/vistas/cursos.hbs'));
});

app.get('/crear-cursos', function (req, res) {
    res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'));
});

app.get('/listar-cursos', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
    };
    res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'));
});

app.get('/ver-inscritos', function (req, res) {
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
    res.render(path.join(__dirname + '/vistas/ver-inscritos.hbs'));
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

app.get('/ver-curso/:id', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    const id = req.params.id;
    curso = cursos.filter(function (item) {
        return item.idCurso === id
    });
    res.locals = {
        curso: curso[0]
    };
    res.render(path.join(__dirname + '/vistas/ver-curso.hbs'));
});

app.get('/proceso-inscripcion/', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        })
    };
    res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'));
});

app.post('/guardar-proceso-inscripcion/', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    var inscritos = JSON.parse(fs.readFileSync('inscritos.json', 'utf8'));
    var usuarios = JSON.parse(fs.readFileSync('usuarios.json', 'utf8'));
    var guardado = false;
    const body = req.body;
    var existeUsuarioCurso = inscritos.some(function (item) {
        return item.idCurso === body.idCurso && item.documento === body.documento
    });
    if(! existeUsuarioCurso || existeUsuarioCurso === null){
        guardado = true;
        if(! usuarios.some(function (item) {
            return item.documento === body.documento
        })){
            usuarios.push({
                nombre: body.nombre,
                correo: body.correo,
                telefono: body.telefono,
                documento: body.documento
            });
        }
        escribirArchivo("usuarios.json", usuarios);
        inscritos.push({
            idCurso: body.idCurso,
            documento: body.documento
        });
        escribirArchivo("inscritos.json", inscritos);
    }
    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
        guardado: guardado,
        existeUsuarioCurso: existeUsuarioCurso
    };
    res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'));
});


app.post('/guardar-cursos', function (req, res) {
    var cursos = JSON.parse(fs.readFileSync('cursos.json', 'utf8'));
    var guardado = false;
    const body = req.body;
    var existeCurso = cursos.some( m => m.idCurso === body['idCurso']);
    var cursosActuales = cursos;
    cursosActuales.push({
        idCurso: body['idCurso'],
        nombre: body['nombre'],
        descripcion: body['descripcion'],
        valor: body['valor'],
        intensidad: body['intensidadHoraria'],
        modalidad: body['modalidad'],
        estado: 'disponible',
    });
    if(! existeCurso){
        guardado = true;
        escribirArchivo("cursos.json", cursosActuales);
    }
    res.locals = {
        existeCurso: existeCurso,
        guardado: guardado
    };
    res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'));
});

app.listen(3000, function () {
    // cursos
    fs.exists("cursos.json", function (exists) {
            if (!exists) {
                // usuarios
                escribirArchivo("cursos.json", []);
            }
        }
    );
    fs.exists("usuarios.json", function (exists) {
            if (!exists) {
                // usuarios
                escribirArchivo("usuarios.json", []);
            }
        }
    );
    fs.exists("inscritos.json", function (exists) {
            if (!exists) {
                // inscritos
                escribirArchivo("inscritos.json", []);
            }
        }
    );
});

function escribirArchivo(nombre, contenido) {
    fs.writeFile(nombre, JSON.stringify(contenido), function (err, data) {});
}


