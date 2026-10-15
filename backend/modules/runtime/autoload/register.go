package autoload

import (
	module "github.com/hvritual/cs-biz/backend/modules/runtime"
	"github.com/hvritual/yunka.io/framework/core/modulecatalog"
)

func init() { modulecatalog.MustRegister(module.GeneratedDescriptor()) }
