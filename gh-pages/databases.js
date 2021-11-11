$(document).ready(function() {
  var proxy_url = 'https://libproxy.fitsuny.edu/login?url='
  $.getJSON("databases.json", function(databases) {
      databases.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
      list_databasesAZ(databaseConstruct(databases), databases);
    })
    .fail(function() {
      console.log("error");
    });

  function createListing(database) {
    var url = database.meta.enable_proxy ? proxy_url + database.url : database.url;
    var database_listing = `
        <div class='database py-4 border-bottom'>
        <div class="row">
          <div class="col-auto pe-0">
            <button class="bg-transparent border-0 h3" type="button" data-bs-toggle="collapse" data-bs-target="#database-${database.id}" aria-expanded="false" aria-controls="database-${database.id}" aria-label="Expand">
              <i class="bi bi-plus-circle" title="Expand" aria-hidden="true"></i>
            </button>
          </div>
          <div class="col">
            <h3>
              <a class="text-decoration-none" href="${database.meta.enable_proxy ? proxy_url + database.url : database.url}">
                ${database.name}
              </a>
            </h3>
            <div class="database-body collapse" id="database-${database.id}">
            </div>
          </div>
        </div>

        </div>
      `;
    database_listing = $(database_listing);
    if (database.enable_trial) {
      database_listing.find('h3').append(`<span class="badge bg-primary rounded-pill fs-6 align-text-top">Trial</span>`);
    }
    if (database.description) {
      database_listing.find('.database-body').append(`<p>${database.description}</p>`);
    }
    if (database.meta.more_info) {
      database_listing.find('.database-body').append(`<p>${database.meta.more_info}</p>`);
    }
    if (database.az_types) {
      database_listing.find('.database-body').append(`<h4><small>Related Topics<small></h4>`);
      subjectNav = `
      <ul class="nav subject-nav" role="tablist">
      </ul>
      `;
      subjectNav = $(subjectNav);
      $.each(database.az_types, function(i, subject) {
        subjectLink = `
        <li class="nav-item" role="presentation">
          <button class="nav-link bg-transparent border-0 p-0 me-4 btn-sm text-dark" type="button" role="tab" data-target="${subject.id}" data-name="${subject.name}" aria-controls="${subject.id}" aria-selected="false">${subject.name}</button>
        </li>
        `;
        $(subjectNav).append(subjectLink);
      });
      database_listing.find('.database-body').append(subjectNav);
    }
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
        $('#atoz button:disabled').prop('disabled', false);
        $('#search').find('input').val("");
        list_databasesAZ(subList, cleanDatabaseList);
        $('#databases-title').children().remove();
        $('#subject-browse').val(subjectID);
        $('#databases-title').append(`<br><small class="text-muted">${subjectName}</small>`);
      });
    });
  }

  function list_databasesAZ(databaseList, cleanDatabaseList) {
    $('#databases').hide().empty();
    $.each(databaseList, function(initial, letterGroup) {
      var groupDiv = `
        <div>
        <h2 class="mt-4 display-3" id="${initial.toLowerCase()}">${initial}</h2>
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
    // add anchors
    anchors.add('h2');
    activateSubjects(cleanDatabaseList);

  }

  function listSearchResults(query, results, cleanDatabaseList) {
    $('#databases').hide().empty();
    $('#atoz button:disabled').prop('disabled', false);
    $('#databases-title').children().remove();
    $('#subject-browse').val('all');
    $('#databases').append(`<h2 class="mt-4 mb-3 display-5">Results for "${query}"</h2>`);
    if (results.length > 0) {
      $.each(results, function(i, result) {
        var thisDatabase = cleanDatabaseList[result["ref"]];
        $('#databases').append(createListing(thisDatabase));
      });
      activateSubjects(cleanDatabaseList);
    } else {
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

  function databaseConstruct(databases) {
    const aTOzList = {};
    const subjectList = {};
    $.each(databases, function(i, database) {
      firstLetter = database.name.charAt(0).toUpperCase();
      if (firstLetter in aTOzList) {
        aTOzList[firstLetter].push(database);
      } else {
        aTOzList[firstLetter] = [database];
      }
      $.each(database.az_types, function(index, subject) {
        if (!(subject.name in subjectList)) {
          subjectList[subject.name] = subject.id;
        }
      });
    });
    // Create Subject/Search navigation
    var subSearchNav = `
    <div class="row  mt-4">
      <div class="col-auto">
      <select class="form-select" id="subject-browse" aria-label="Browse databases by subject">
      </select>
      </div>
      <div class="col-auto">
        <form id="search">
          <div class="input-group">
            <input type="search" class="form-control" placeholder="Search databases" aria-label="Search databases">
            <button class="btn btn-secondary" type="submit" aria-label="Search">
              <i class="bi bi-search" title="Search" aria-hidden="true"></i>
            </button>
          </div>
        </form>
      </div>
    </div>
    `;
    subSearchNav = $(subSearchNav);
    var opts_list = '';
    $.each(subjectList, function(subjectName, subjectID) {
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
        $('#databases-title').children().remove();
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
        $('#atoz button:disabled').prop('disabled', false);
        $('#search').find('input').val("");
        list_databasesAZ(subList, databases);
        $('#databases-title').children().remove();
        $('#databases-title').append(`<br><small class="text-muted">${subjectName}</small>`);
      }
    });

    // Create Search Index
    var searchIndex = elasticlunr(function() {
      this.addField('title');
      this.addField('body');
      this.addField('subjects');
      this.setRef('id');
    });
    $.each(databases, function(key, database) {
      var subjectString = ''
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
            body: {
              boost: 1
            },
            subjects: {
              boost: 1
            },
          }
        });
        listSearchResults(query, results, databases)
      }

    });


    // Create A to Z navigation
    aTOzNav = `
    <ul class="nav nav-fill mt-4" role="tablist" id="atoz">
      <li class="nav-item" role="presentation">
        <button class="nav-link bg-transparent border-0 px-0 me-2" type="button" role="tab" data-target="All" aria-controls="All" aria-selected="true" disabled>All</button>
      </li>
    </ul>
    `;
    aTOzNav = $(aTOzNav);
    $.each(aTOzList, function(initial) {
      letterLink = `
      <li class="nav-item" role="presentation">
        <button class="nav-link bg-transparent border-0 px-0 me-2" type="button" role="tab" data-target="${initial}" aria-controls="${initial.toLowerCase()}" aria-selected="false">${initial}</button>
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
        $('#databases-title').children().remove();
        $('#subject-browse').val('all');
        $('#search').find('input').val("");
        var letter = $(this).data('target');
        if (letter == 'All') {
          list_databasesAZ(aTOzList, databases);
        } else {
          const subList = {};
          subList[letter] = aTOzList[letter];
          list_databasesAZ(subList, databases);
        }
      });
    });


    return aTOzList;
  }
});