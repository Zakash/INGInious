db.getCollection('submissions').find({username: ['student1']}).limit(20).sort( {submitted_on:  -1 })