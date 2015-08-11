
//load and control the 3d model of neptunus and the compass

var scene, camera, renderer, neptunus, compass;
var zaxis = new THREE.Vector3(0,0,1);

function handleAnimation(){

		var container = document.getElementById("animation_model");
		scene = new THREE.Scene();

		//Camera
		camera = new THREE.PerspectiveCamera( 50, (window.innerHeight/2)/(window.innerHeight/2), 0.1, 1000 );
		camera.position.z = 18;

		//Renderer
		renderer = new THREE.WebGLRenderer({ alpha: true });
		renderer.setSize((window.innerHeight/2),(window.innerHeight/2));
		container.appendChild( renderer.domElement );

    //light
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,0,100);
    scene.add(light);

		//neptunus 3d model build with blender
		var loader = new THREE.JSONLoader();
		loader.load( 'images/neptunus2.json', function ( geometry ) {
			var neptunus_material = new THREE.MeshLambertMaterial( { color: 0xffff00 } );
			neptunus = new THREE.Mesh( geometry, neptunus_material );

							neptunus.position.x =0;
							neptunus.position.y =0;
							neptunus.position.z =0;
							neptunus.rotation.set(Math.PI/2, Math.PI/2, 0);
							scene.add( neptunus );
		});

		//compass 3d model build with blender
		var loader_compass = new THREE.JSONLoader();
		loader_compass.load( 'images/Compas.json', function ( geometry ) {
			var compass_material = new THREE.MeshLambertMaterial( { color: 0x996633 } );
			compass = new THREE.Mesh( geometry, compass_material );

							compass.position.x =0;
							compass.position.y =0;
							compass.position.z =0;
							compass.rotation.set(Math.PI/2, Math.PI/2, 0);
							scene.add( compass );
		});


		render();

    // Rendering function
    function render() {
	        requestAnimationFrame(render);
	        renderer.autoClear = false;
	        renderer.clear();
	        renderer.render(scene, camera);
    };
}


//Update 3d model in roll
function updateNeptunusRoll(roll){
	if(neptunus){
	 neptunus.rotateOnAxis( zaxis	, neptunus.rotation.z + roll/360*Math.PI*2);
	}
}

//Update 3d model in pitch
function updateNeptunusPitch(pitch){
	if(neptunus){
		neptunus.rotation.x=(Math.PI/2-pitch/360*Math.PI*2);
	}
}

//Update "compass" model in heading
function updateComass3DModel(heading){
		if(compass){
			compass.rotation.y = (Math.PI/2+ heading/360*Math.PI*2);
		}
}
