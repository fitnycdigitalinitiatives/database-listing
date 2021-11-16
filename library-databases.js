$(document).ready(function() {
  //1st append the container to the page
  $('main').append(`
    <div class="container container--big">
      <section>
        <h2 id="databases-title">Databases
        <br>
        <div id="databases-subtitle">
        A to Z
        </div>
        </h2>
        <div id="databases">
        </div>
      </section>
    </div>
  `);
  $.getJSON("https://fitnycdigitalinitiatives.github.io/database-listing/databases.json", function(databases) {
      databases.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
      var queryParams = new URLSearchParams(window.location.search);
      if (queryParams.toString() && (queryParams.has('letter') || queryParams.has('subject'))) {
        if (queryParams.has('letter')) {
          let theLetter = queryParams.get('letter').toUpperCase();
          //create full list and then get sublist for that letter specifically
          var initialaTOZList = createAtoZList(databases);
          if (theLetter in initialaTOZList) {
            navConstruct(initialaTOZList, databases);
            $('#atoz button:disabled').prop('disabled', false);
            $(`#atoz button[data-target='${theLetter}']`).prop('disabled', true);
            const subList = {};
            subList[theLetter] = initialaTOZList[theLetter];
            list_databasesAZ(subList, databases);
          } else {
            console.log("This is not a valid A to Z letter");
            cleanStartup(databases);
          }
        } else if (queryParams.has('subject')) {
          let theSubjectID = queryParams.get('subject');
          let theFullSubjectList = createSubjectList(databases);
          if (theSubjectID in theFullSubjectList) {
            var initialaTOZList = createAtoZList(databases);
            navConstruct(initialaTOZList, databases);
            let theSubjectName = theFullSubjectList[theSubjectID];
            const subList = {};
            $.each(databases, function(i, database) {
              if (database.az_types) {
                $.each(database.az_types, function(i, subject) {
                  if (subject.id == theSubjectID) {
                    firstLetter = database.name.charAt(0).toUpperCase();
                    if (firstLetter in subList) {
                      subList[firstLetter].push(database);
                    } else {
                      subList[firstLetter] = [database];
                    }
                  }
                });
              }
            });
            //enable and disable buttons
            $('#atoz button').prop('disabled', true);
            $(`#atoz button[data-target='All']`).prop('disabled', false);
            $('#search').find('input').val("");
            list_databasesAZ(subList, databases);
            $('#subject-browse').val(theSubjectID);
            $('#databases-subtitle').text(theSubjectName);
          } else {
            console.log("This is not a valid subject ID");
            cleanStartup(databases);
          }

        }
      } else {
        cleanStartup(databases);
      }

    })
    .fail(function() {
      console.log("error");
      $('#databases-subtitle').text('Error');
      var error = `
      <p>
        It seems that there is currently a technical issue preventing us from loading the database listings. Please try reloading the page or viewing the database listings <a href="https://fitnyc.libguides.com/az.php">here</a> instead. If you are still having difficulties please contact us using our <a href="http://fitnyc.libanswers.com/">Ask the Library</a> service.
      </p>
      `;
      $('#databases').append(error);
    });

  function cleanStartup(databases) {
    var initialaTOZList = createAtoZList(databases);
    navConstruct(initialaTOZList, databases);
    list_databasesAZ(initialaTOZList, databases);
  }

  function createListing(database) {
    var database_listing = `
        <div class='database'>
          <div class="button-col">
            <button class="accordion__icon" type="button" data-target="#database-${database.id}" aria-expanded="false" aria-controls="databases" aria-label="Expand">
            </button>
          </div>
          <div class="listing-col">
            <h3 class="database-title">
              <a class="database-link" href="${database.url}" target="_blank">
                ${database.name}
                <i class="fas fa-caret-right"></i>
              </a>
            </h3>
            <div class="database-body" id="database-${database.id}">
            </div>
          </div>
        </div>
      `;
    database_listing = $(database_listing);
    database_body = database_listing.find('.database-body');
    if (database.enable_trial) {
      database_listing.find('h3').append(`<span class="badge bg-primary rounded-pill fs-6 align-top">Trial</span>`);
    }
    if (database.enable_new) {
      database_listing.find('h3').append(`<span class="badge bg-primary rounded-pill fs-6 align-top">New</span>`);
    }
    if (database.description) {
      database_body.append(`<p>${database.description}</p>`);
    }
    if (database.meta.more_info) {
      database_body.append(`<p>${database.meta.more_info}</p>`);
    }
    if (database.alt_names) {
      database_body.append(`<h4><small>Also Known As<small></h4>`);
      database_body.append(`<p>${database.alt_names}</p>`);
    }
    if (database.az_types) {
      database_body.append(`<h4><small>Related Topics<small></h4>`);
      subjectNav = `
      <ul class="subject-nav" role="tablist">
      </ul>
      `;
      subjectNav = $(subjectNav);
      $.each(database.az_types, function(i, subject) {
        subjectLink = `
        <li role="presentation">
          <button type="button" role="tab" data-target="${subject.id}" data-name="${subject.name}" aria-controls="databases" aria-selected="false">
          ${subject.name}
          <i class="fas fa-caret-right"></i>
          </button>
        </li>
        `;
        $(subjectNav).append(subjectLink);
      });
      database_body.append(subjectNav);
    }
    $(database_listing).find('button').click(function() {
      let target = $(this).data('target');
      if ($(`${target}`).hasClass('active')) {
        $(`${target}`).slideUp(function() {
          $(this).toggleClass('active');
        });
      } else {
        $(`${target}`).slideDown(function() {
          $(this).toggleClass('active');
        });
      }
    });
    return database_listing;
  }

  function activateSubjects(cleanDatabaseList) {
    // Subject buttons
    $('.subject-nav button').each(function(index) {
      $(this).click(function() {
        var subjectID = $(this).data('target');
        var subjectName = $(this).data('name');
        const subList = {};
        $.each(cleanDatabaseList, function(i, database) {
          if (database.az_types) {
            $.each(database.az_types, function(i, subject) {
              if (subject.id == subjectID) {
                firstLetter = database.name.charAt(0).toUpperCase();
                if (firstLetter in subList) {
                  subList[firstLetter].push(database);
                } else {
                  subList[firstLetter] = [database];
                }
              }
            });
          }
        });
        //enable and disable buttons
        $('#atoz button').prop('disabled', true);
        $(`#atoz button[data-target='All']`).prop('disabled', false);
        $('#search').find('input').val("");
        list_databasesAZ(subList, cleanDatabaseList);
        $('#subject-browse').val(subjectID);
        $('#databases-subtitle').text(subjectName);
        // Update URL Query.
        var queryParams = new URLSearchParams(window.location.search);
        queryParams.delete("letter");
        queryParams.set("subject", subjectID);
        history.replaceState(null, null, "?" + queryParams.toString());
      });
    });
  }

  function list_databasesAZ(databaseList, cleanDatabaseList) {
    $('#databases').hide().empty();
    $.each(databaseList, function(initial, letterGroup) {
      var groupDiv = `
        <div>
        <h2 class="letter-header" id="${initial.toLowerCase()}">${initial}</h2>
        </div>
      `;
      groupDiv = $(groupDiv);
      $.each(letterGroup, function(index, database) {
        $(groupDiv).append(createListing(database));
      });
      $('#databases').append(groupDiv);
    });
    $("html, body").scrollTop(0);
    $('#databases').fadeIn();
    activateSubjects(cleanDatabaseList);

  }

  function listSearchResults(query, results, cleanDatabaseList) {
    $('#databases').hide().empty();
    $('#databases-subtitle').text('Search');
    $('#subject-browse').val('all');
    $('#databases').append(`<h2 class="mt-4 mb-3 display-5">Results for "${query}"</h2>`);
    if (results.length > 0) {
      $('#atoz button').prop('disabled', true);
      $(`#atoz button[data-target='All']`).prop('disabled', false);
      $.each(results, function(i, result) {
        var thisDatabase = cleanDatabaseList[result["ref"]];
        $('#databases').append(createListing(thisDatabase));
      });
      activateSubjects(cleanDatabaseList);
    } else {
      $('#atoz button:disabled').prop('disabled', false);
      var noResults = `
      <div>
      <p class="lead">
        It doesn't look like your search turned up any results. Please try searching for another term, or browsing by subject or through the A to Z list.
      </p>
      </div>
      `;
      $('#databases').append(noResults);
    }
    $("html, body").scrollTop(0);
    $('#databases').fadeIn();
  }

  function createAtoZList(databases) {
    const aTOzList = {};
    $.each(databases, function(i, database) {
      let firstLetter = database.name.charAt(0).toUpperCase();
      if (firstLetter in aTOzList) {
        aTOzList[firstLetter].push(database);
      } else {
        aTOzList[firstLetter] = [database];
      }
      if (database.alt_names) {
        $.each(database.alt_names.split(","), function(index, altName) {
          altName = altName.trim();
          let altfirstLetter = altName.charAt(0).toUpperCase();
          let altDatabase = JSON.parse(JSON.stringify(database));
          altDatabase["name"] = `${altName} (see ${database.name})`;
          altDatabase["alt_names"] = "";
          altDatabase["id"] += "-" + index;
          if (altfirstLetter in aTOzList) {
            aTOzList[altfirstLetter].push(altDatabase);
          } else {
            aTOzList[altfirstLetter] = [altDatabase];
          }
        });
      }
    });
    return aTOzList;
  }

  function createSubjectList(databases) {
    const subjectList = {};
    $.each(databases, function(i, database) {
      $.each(database.az_types, function(index, subject) {
        if (!(subject.name in subjectList)) {
          subjectList[subject.id] = subject.name;
        }
      });
    });
    return subjectList;
  }

  function navConstruct(aTOzList, databases) {
    // Create Subject/Search navigation
    var subSearchNav = `
    <div id="databases-subsearch">
      <div>
        <select id="subject-browse" aria-label="Browse databases by subject">
        </select>
      </div>
      <div>
        <form id="search">
          <div class="input-group">
            <input type="search" placeholder="Search databases" aria-label="Search databases">
            <button type="submit" aria-label="Search">
              <i class="fa fa-search" title="Search" aria-hidden="true"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
    `;
    subSearchNav = $(subSearchNav);
    var opts_list = '';
    $.each(createSubjectList(databases), function(subjectID, subjectName) {
      opts_list += `
      <option value="${subjectID}">${subjectName}</option>
      `;
    });
    opts_list = $(opts_list);
    opts_list.sort(function(a, b) {
      return $(a).text() > $(b).text() ? 1 : -1;
    });
    $(subSearchNav).find('#subject-browse').append(`<option selected value="all">Browse databases by subject</option>`);
    $(subSearchNav).find('#subject-browse').append(opts_list);
    $('#databases').before(subSearchNav);
    $('#subject-browse').change(function() {
      var subjectValue = $(this).val();
      var subjectName = $(this).children('option:selected').text();
      if (subjectValue == "all") {
        $('#databases-subtitle').text('A to Z');
        $('#atoz button:disabled').prop('disabled', false);
        $("#atoz button[data-target='All']").prop('disabled', true);
        list_databasesAZ(aTOzList, databases);
      } else {
        const subList = {};
        $.each(databases, function(i, database) {
          if (database.az_types) {
            $.each(database.az_types, function(i, subject) {
              if (subject.id == subjectValue) {
                firstLetter = database.name.charAt(0).toUpperCase();
                if (firstLetter in subList) {
                  subList[firstLetter].push(database);
                } else {
                  subList[firstLetter] = [database];
                }
              }
            });
          }
        });
        //enable and disable buttons
        $('#atoz button').prop('disabled', true);
        $(`#atoz button[data-target='All']`).prop('disabled', false);
        $('#search').find('input').val("");
        list_databasesAZ(subList, databases);
        $('#databases-subtitle').text(subjectName);
        // Update URL Query.
        var queryParams = new URLSearchParams(window.location.search);
        queryParams.delete("letter");
        queryParams.set("subject", subjectValue);
        history.replaceState(null, null, "?" + queryParams.toString());
      }
    });

    // Create Search Index
    var searchIndex = elasticlunr(function() {
      this.addField('title');
      this.addField('alt_names');
      this.addField('body');
      this.addField('subjects');
      this.setRef('id');
      this.saveDocument(false);
    });
    $.each(databases, function(key, database) {
      var subjectString = '';
      $.each(database.az_types, function(index, subject) {
        if (index == 0) {
          subjectString += subject.name;
        } else {
          subjectString += ' ' + subject.name;
        }
      });
      var doc = {
        "id": key,
        "title": database.name,
        "alt_names": database.alt_names,
        "body": database.description + database.meta.more_info,
        "subjects": subjectString
      }
      searchIndex.addDoc(doc);
    });
    $("#search").submit(function(event) {
      event.preventDefault();
      var query = $(this).find('input').val();
      if (query) {
        var results = searchIndex.search(query, {
          fields: {
            title: {
              boost: 2
            },
            alt_names: {
              boost: 2
            },
            body: {
              boost: 1
            },
            subjects: {
              boost: 1
            },
          },
          bool: "AND"
        });
        listSearchResults(query, results, databases);
        // Update URL Query.
        var queryParams = new URLSearchParams(window.location.search);
        queryParams.delete("letter");
        queryParams.delete("subject");
        history.replaceState(null, null, window.location.pathname);
      }

    });


    // Create A to Z navigation
    aTOzNav = `
    <ul role="tablist" id="atoz">
      <li role="presentation">
        <button type="button" role="tab" data-target="All" aria-controls="databases" aria-selected="true" disabled>All</button>
      </li>
    </ul>
    `;
    aTOzNav = $(aTOzNav);
    $.each(aTOzList, function(initial) {
      letterLink = `
      <li role="presentation">
        <button type="button" role="tab" data-target="${initial}" aria-controls="databases" aria-selected="false">${initial}</button>
      </li>
      `;
      $(aTOzNav).append(letterLink);
    });
    $('#databases').before(aTOzNav);
    $("#atoz button").each(function(index) {
      $(this).click(function() {
        //enable and disable buttons
        $('#atoz button:disabled').prop('disabled', false);
        $(this).prop('disabled', true);
        $('#subject-browse').val('all');
        $('#search').find('input').val("");
        var letter = $(this).data('target');
        if (letter == 'All') {
          $('#databases-subtitle').text('A to Z');
          list_databasesAZ(aTOzList, databases);
          // Update URL Query.
          var queryParams = new URLSearchParams(window.location.search);
          queryParams.delete("letter");
          queryParams.delete("subject");
          history.replaceState(null, null, window.location.pathname);
        } else {
          $('#databases-subtitle').text(letter);
          const subList = {};
          subList[letter] = aTOzList[letter];
          list_databasesAZ(subList, databases);
          // Update URL Query.
          var queryParams = new URLSearchParams(window.location.search);
          queryParams.set("letter", letter);
          queryParams.delete("subject");
          history.replaceState(null, null, "?" + queryParams.toString());
        }
      });
    });
  }
});