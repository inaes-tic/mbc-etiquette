$(document).ready(function() {

    window.stage = new Kinetic.Stage({
        container: 'container',
        width: 400,
        height: 300,
    });
    stage.add(new Kinetic.Layer());

    $('#container').css({
        width: stage.getWidth() + 'px',
        height: stage.getHeight() + 'px'
    });

    $("#webvfx-collection").sortable({
        stop: function(event, ui) {
            var total = $('#webvfx-collection div').length - 1;
            var index = ui.item.index();
            ui.item.trigger('drop', total - index);
        }
    });

    window.webvfxCollection = new WebvfxCollection();
    webvfxCollection.add(new WebvfxRect({title: 'rect 1', x: 20, y: 20, fill: 'red'}));
    webvfxCollection.add(new WebvfxRect({title: 'rect 2', x: 40, y: 40, fill: 'yellow'}));
    webvfxCollection.add(new WebvfxRect({title: 'rect 3', x: 60, y: 60, fill: 'blue'}));
    webvfxCollection.add(new WebvfxRect({title: 'rect 4', x: 80, y: 80, fill: 'green'}));

    var webvfxCollectionView = new WebvfxCollectionView(webvfxCollection);
});
