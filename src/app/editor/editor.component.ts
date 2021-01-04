import { Component, OnInit } from '@angular/core';

declare var CKEDITOR: any;

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {


  CONTACTS = [{
    name: 'Huckleberry Finn',
    tel: '+48 1345 234 235',
    email: 'h.finn@example.com',
    avatar: 'hfin'
  },
  {
    name: 'D\'Artagnan',
    tel: '+45 2345 234 235',
    email: 'dartagnan@example.com',
    avatar: 'dartagnan'
  },
  {
    name: 'Phileas Fogg',
    tel: '+44 3345 234 235',
    email: 'p.fogg@example.com',
    avatar: 'pfog'
  },
  {
    name: 'Alice',
    tel: '+20 4345 234 235',
    email: 'alice@example.com',
    avatar: 'alice'
  },
  {
    name: 'Little Red Riding Hood',
    tel: '+45 2345 234 235',
    email: 'lrrh@example.com',
    avatar: 'lrrh'
  },
  {
    name: 'Winnetou',
    tel: '+44 3345 234 235',
    email: 'winnetou@example.com',
    avatar: 'winetou'
  },
  {
    name: 'Edmond Dantès',
    tel: '+20 4345 234 235',
    email: 'count@example.com',
    avatar: 'edantes'
  },
  {
    name: 'Robinson Crusoe',
    tel: '+45 2345 234 235',
    email: 'r.crusoe@example.com',
    avatar: 'rcrusoe'
  }
  ];
  constructor() { }

  ngOnInit() {
    console.log("CKEDITOR", CKEDITOR);



    CKEDITOR.disableAutoInline = true;

    CKEDITOR.domReady = (data) => {
      console.log("DATA", data);
    }

    // Implements a simple widget that represents contact details (see http://microformats.org/wiki/h-card).
    CKEDITOR.plugins.add('hcard', {
      requires: 'widget',
      init: (editor) => {
        editor.widgets.add('hcard', {
          allowedContent: 'span[*]{*}(*); a[href](!u-email,!p-name); span(!p-tel)',
          requiredContent: 'span(h-card)',
          extraAllowedContent: "span[*]{*}(*)",
          pathName: 'hcard',

          upcast: (el) => {
            return el.name == 'span' && el.hasClass('h-card');
          }
        });

        // This feature does not have a button, so it needs to be registered manually.
        editor.addFeature(editor.widgets.registered.hcard);


        editor.on("drop", (event) => {
          console.log("EVENT", event);
        });


        let fileLoader;

        editor.on('fileUploadRequest', function (evt) {
          evt.stop();
          console.log("fileUploadRequest event.data", evt.data);
          evt.data.fileLoader.uploaded = 1;
          fileLoader = evt.data.fileLoader;

          let xhr = evt.data.fileLoader.xhr;
          // window["xhr"] = xhr;
          xhr.open('GET', 'http://localhost:4200', true);
          xhr.send(null);
    

          // return evt.data.fileLoader.xhr;
        });




        editor.on('fileUploadResponse', function (evt) {
          evt.stop();
          console.log("fileUploadResponse event.data", evt);
          evt.data.url = fileLoader.data;
          evt.data.response = {
              uploaded: 1,
              url: fileLoader.data,
              fileName: "image.jpg"
          };//evt.data.fileLoader.data;
    
          return evt;
        });

        // Handle dropping a contact by transforming the contact object into HTML.
        // Note: All pasted and dropped content is handled in one event - editor#paste.
        editor.on('paste', (evt) => {
          let contact = evt.data.dataTransfer.getData('contact');
          if (!contact) {
            return;
          }

          evt.data.dataValue =
            '<span class="h-card" data-columnName="username">' +
            '<a href="mailto:' + contact.email + '" class="p-name u-email">' + contact.name + '</a>' +
            ' ' +
            '<span class="p-tel">' + contact.tel + '</span>' +
            '</span>';
        });
      }
    });


    this.addItems(
      CKEDITOR.document.getById('contactList'),
      new CKEDITOR.template(
        '<div class="contact" data-contact="{id}">' +
        '<p style="color: red">{name}</p>' +
        '</div>'
      ),
      this.CONTACTS
    );




  }


  addItems(listElement, template, items) {

    for (let i = 0, draggable, item; i < items.length; i++) {
      item = new CKEDITOR.dom.element('li');
      draggable = CKEDITOR.dom.element.createFromHtml(
        template.output({
          id: i,
          name: items[i].name
        })
      );

      // console.log("draggable", draggable);


      draggable.setAttributes({
        draggable: 'true',
        tabindex: '0'
      });

      item.append(draggable);
      listElement.append(item);
    }




    CKEDITOR.on('instanceReady', () => {

      console.log("On instance ready ", CKEDITOR.document.getById('contactList'));

      // When an item in the contact list is dragged, copy its data into the drag and drop data transfer.
      // This data is later read by the editor#paste listener in the hcard plugin defined above.
      CKEDITOR.document.getById('contactList').on('dragstart', (evt) => {
        // The target may be some element inside the draggable div (e.g. the image), so get the div.h-card.
        let target = evt.data.getTarget().getAscendant('div', true);

        // Initialization of the CKEditor 4 data transfer facade is a necessary step to extend and unify native
        // browser capabilities. For instance, Internet Explorer does not support any other data type than 'text' and 'URL'.
        // Note: evt is an instance of CKEDITOR.dom.event, not a native event.
        CKEDITOR.plugins.clipboard.initDragDataTransfer(evt);

        let dataTransfer: any = evt.data.dataTransfer;

        // Pass an object with contact details. Based on it, the editor#paste listener in the hcard plugin
        // will create the HTML code to be inserted into the editor. You could set 'text/html' here as well, but:
        // * It is a more elegant and logical solution that this logic is kept in the hcard plugin.
        // * You do not know now where the content will be dropped and the HTML to be inserted
        // might vary depending on the drop target.

        console.log("target data", target.data('contact'));
        dataTransfer.setData('contact', this.CONTACTS[target.data('contact')]);

        // You need to set some normal data types to backup values for two reasons:
        // * In some browsers this is necessary to enable drag and drop into text in the editor.
        // * The content may be dropped in another place than the editor.
        console.log("target getText", target.getText());
        dataTransfer.setData('text/html', target.getText());

        // You can still access and use the native dataTransfer - e.g. to set the drag image.
        // Note: IEs do not support this method... :(.

        // console.log("data transfer", dataTransfer)

        console.log("dataTransfer.$", dataTransfer.$);

        console.log("dataTransfer.$", target.findOne('img').$);


        if (dataTransfer.$ & dataTransfer.$.setDragImage) {
          dataTransfer.$.setDragImage(target.findOne('img').$, 0, 0);
        }
      });
    });

    // Initialize the editor with the hcard plugin.
    CKEDITOR.replace('editor1', {
      language: 'en',
      extraPlugins: 'print,tableresize,liststyle,pagebreak,exportpdf,format,font,colorbutton,hcard,justify, image2',
      removePlugins: 'image, save',
      filebrowserUploadUrl: 'http://localhost:3000/uploader',
      uploadUrl: 'http://localhost:3000/uploader'
    });

  }

}
