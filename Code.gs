// enable lodash.js library in Google Apps Script
// see https://github.com/contributorpw/lodashgs
var _ = LodashGS.load();

// render default home page card.
function on_home_page(event){
    var card = build_search_card();
    return[card];
}

// render gmail context card.
function on_message_selected(event){
    var emails = extract_emails_from_message(event);
    var people = fetch_people(emails);
    if (people.length ==0 ){
        var card = build_search_card("No team members found for current message.");
        return[card];
    }
    var card = build_search_card(people);
    return[card];
}

// return calendar context card.
function on_calendar_event_open(event){
    var emails = extract_emails_from_calendar_event(event);
    var people = fetch_people(emails);
    if (people.length == 0){
        var card = build_search_card("No team members found for current event.");
        return[card];
    }
    var card = build_search_card(people);
    return[card];
}

// render drive context card.
function on_drive_item_selected(event){
    // do not run if muliple files selected.
    if(event.drive.selectedItems.length != 1){
        var message = "To view team members collaborating on a file, select one file only.";
        var card = build_search_card(message);
        return[card];
    }

    var selected_item = event.drive.selectedItems[0];
    // check if user lacks file access to read ACL, ask user to authorize.
    if(!selected_item.addonHasFileScopePermission){
        var auth_files_action = CardService.newAction()
            .setFunctionName("on_auth_drive_files")
            .setLoadIndicator(CardService.LoadIndicator.SPINNER)
            .setParameters({id: selected_item.id});
        var auth_message = CardService.newTextParagraph()
            .setText("To view the people on your team the file is shared with, click *Authorize* to grant access.");
        var auth_button = CardService.newTextButton()
            .setText("Authorize")
            .setOnClickAction(auth_files_action);
        var card = CardService.newCardBuilder()
            .addSection(CardService.newCardSection()
                .addWidget(auth_message)
                .addWidget(auth_button))
            .build();
        return[card];
    }

    // user has access, extract ACLs to find co-workers
    var emails = extract_emails_from_drive_permissions(event);
    var people = fetch_people(emails);
    if(people.length == 0){
        var card = build_search_card("No team members found for current file.");
        return[card];
    }
    var card = build_team_list_card(people);
    return[card];
}

// handle the click event when requesting drive file access.
function on_auth_drive_files(event){
    var id = event.parameters.id;
    return CardService.newDriveItemsSelectedActionResponseBuilder()
        .requestFileScope(id)
        .build();
}

// handle the user search request.
function on_search(event){
    //check if search fields are empty.
    if(!event.formInputs || !event.formInputs.query){
        var notification = CardService.newNotification()
            .setText("Enter a query before searching.");
        return CardService.newActionResponseBuilder()
            .setNotification(notification)
            .build();
    }

    var query = event.formInputs.query[0];
    var people = query_people(query);

    if(!people || !people.length == 0){
        var notification = CardService.newNotification().setText("No people found.");
        return CardService.newActionResponseBuilder()
            .setNotification(notification)
            .build();
    }

    var card = build_team_list_card(people);
    var nav = CardService.newNavigation().pushCard(card);
    return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();  
}

// handle viewing detailed info about a person.
function on_show_person_details(event){
    var person = fetch_person(event.parameters.email);
    var card = build_person_details_card(person);
    return[card];
}