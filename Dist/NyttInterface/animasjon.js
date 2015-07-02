
var targetList = [];
var projector;
var mouse = { x: 0, y: 0 };
var scene, camera, animationContainer, renderer, button_Texture, button_material, cube;

function handleAnimation(){
		var container = document.getElementById("animation_model");
		scene = new THREE.Scene();

		camera = new THREE.PerspectiveCamera( 50, (window.innerHeight/2)/(window.innerHeight/2), 0.1, 1000 );
		camera.position.z = 200;

		renderer = new THREE.WebGLRenderer({ alpha: true });
		renderer.setSize((window.innerHeight/2),(window.innerHeight/2));
		container.appendChild( renderer.domElement );

    //light
    var light = new THREE.PointLight(0xffffff);
    light.position.set(0,0,100);
    scene.add(light);

    //cube
		var cube_geometry = new THREE.BoxGeometry( (window.innerHeight/10), (window.innerHeight/10), (window.innerHeight/10) );
		var cube_material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
		cube = new THREE.Mesh( cube_geometry, cube_material );
		scene.add( cube );
		cube.position.x = 0;
		cube.position.y = 0;

		render();



    // Rendering function
    function render() {
        requestAnimationFrame(render);

        // Update the cube rotations

        cube.rotation.x+=0.001;
        cube.rotation.y+=0.001;

        renderer.autoClear = false;
        renderer.clear();
        renderer.render(scene, camera);
    };
}
