'use strict'
var getEntityResolver = require('./util/entity-resolver')
var GraphQL = require('graphql')
var CalendarType = require('./types/CalendarType')
var CalibrationType = require('./types/CalibrationType')
var DeclineType = require('./types/DeclineType')
var DeviceType = require('./types/DeviceType')
var DeviceStatusHistoryType = require('./types/DeviceStatusHistoryType')
var LocationType = require('./types/LocationType')
var MeasurementType = require('./types/MeasurementType')
var ParameterType = require('./types/ParameterType')
var ParameterLimitType = require('./types/ParameterLimitType')
var RawsampleType = require('./types/RawsampleType')
var SettingType = require('./types/SettingType')
var ShiftType = require('./types/ShiftType')
var ShiftPatternType = require('./types/ShiftPatternType')
var SiteType = require('./types/SiteType')
var ZoneType = require('./types/ZoneType')
var resolveMap = require('./resolve-map')
var types = require('./types')
var GraphQLObjectType = GraphQL.GraphQLObjectType
var GraphQLSchema = GraphQL.GraphQLSchema
var GraphQLNonNull = GraphQL.GraphQLNonNull
var GraphQLInt = GraphQL.GraphQLInt
var GraphQLList = GraphQL.GraphQLList
var GraphQLString = GraphQL.GraphQLString
var registerType = resolveMap.registerType

var schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',

    fields: function getRootQueryFields() {
      return {
        locations: {
          type: new GraphQLList(LocationType),

          resolve: getEntityResolver('Location'),

          args: {
            limit: {
              name: 'limit',
              type: GraphQLInt
            }
          }
        },

        calendar: {
          type: CalendarType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Calendar')
        },

        calibration: {
          type: CalibrationType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLString)
            }
          },

          resolve: getEntityResolver('Calibration')
        },

        decline: {
          type: DeclineType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Decline')
        },

        device: {
          type: DeviceType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Device')
        },

        deviceStatusHistory: {
          type: DeviceStatusHistoryType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('DeviceStatusHistory')
        },

        location: {
          type: LocationType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Location')
        },

        measurement: {
          type: MeasurementType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Measurement')
        },

        parameter: {
          type: ParameterType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLString)
            }
          },

          resolve: getEntityResolver('Parameter')
        },

        parameterLimit: {
          type: ParameterLimitType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('ParameterLimit')
        },

        rawsample: {
          type: RawsampleType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Rawsample')
        },

        setting: {
          type: SettingType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Setting')
        },

        shift: {
          type: ShiftType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Shift')
        },

        shiftPattern: {
          type: ShiftPatternType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('ShiftPattern')
        },

        site: {
          type: SiteType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Site')
        },

        zone: {
          type: ZoneType,

          args: {
            id: {
              name: 'id',
              type: new GraphQLNonNull(GraphQLInt)
            }
          },

          resolve: getEntityResolver('Zone')
        }
      }
    }
  })
})

module.exports = schema
