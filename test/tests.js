var chai=require('chai'),
    should=chai.should,
    expect=chai.expect,
    Promise= require('bluebird'),
    request= require('superagent-promise')(require('superagent'),Promise),
    chaiAsPromise=require('chai-as-promised');
chai.use(chaiAsPromise);
var url= process.env.URL || 'http://localhost:8000/todos';


describe('Cross Origin Request',function(){
  var result;

  before(function() {
    result=request('OPTIONS',url)
      .set('Origin','http;//someplace,com')
      .end();
  });

  it('Should return the correct CORS header', function(){
    return assert(result,"header").to.contain.all.keys([
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ]);
  });

  it('Should allow all origins', function(){
    return assert(result, "header.access-control-allow-origin").to.equal('*');
  });

});

describe ('Create Todo Item',function(){
  var result;

  before(function(){
    result= post(url,{title:'Walk the dog'});
  });


  it('Should return a 201 CREATED response',function(){
    return assert(result,"status").to.equal(201);
  });

  it('Should receive a location hyperlink',function(){
    return assert(result,'header.location').to.match(/^https?:\/\/.+\/todos\/[\d]+$/);
  });

  it('Should create de item',function(){
    var item=result.then(function(res){
      return get(res.header['location']);
    });

    after(function(){
      return del(url);
    });
  });
});


describe ('update Todo Item',function(){
  var result;

  beforeEach(function(done){
    post(url,{title:'Walk the dog'}).then(function(res){
      location=res.header['location'];
      done();
    });
  });


  it('Should have completed set to true after PUT update',function(){
    var result=update(location,'PUT',{'completed':true});
    return assert(result,"body.completed").to.be.true;
  });

  it('Should have completed set to true after PATCH update',function(){
    var result=update(location,'PATCH',{'completed':true});
    return assert(result,"body.completed").to.be.true;
  });

  after(function(){
      return del(url);
    });

});

describe ('Delete Todo Item',function(){
  var result;

  beforeEach(function(done){
    post(url,{title:'Walk the dog'}).then(function(res){
      location=res.header['location'];
      done();
    });
  });


  it('Should return a 204 NO CONTENT response',function(){
    var result=del(location);
    return assert(result,"status").to.equal(204);
  });

  it('Should delete the item',function(){
    var result=del(location).then(function(res){
      return get(location);
    });
    return expect(result).to.eventually.be.rejectedWith('Not Found');
  });
});













/**
*
* Convenience functions
*/


// POST request with data and returns Promise
function post(url,data) {
  return request.post(url)
    .set('Content-Type','application/json')
    .set('Accept','application/json')
    .send(data)
    .end();
}


// GET request  and returns Promise
function get(url) {
  return request.get(url)
    .set('Accept','application/json')
    .end();
}


// DELETE request with data and returns Promise
function del(url) {
  return request.del(url).end();
}


// update request with data and returns Promise
function update(url,method,data) {
  return request(method,url)
    .set('Content-Type','application/json')
    .set('Accept','application/json')
    .send(data)
    .end();
}

// Resolve promise for property and return expectation
function assert(result,prop)
{
  return expect(result).to.eventually.have.deep.property(prop);
}
