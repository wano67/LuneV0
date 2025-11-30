"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectTaskOwnershipError = exports.ProjectTaskNotFoundError = exports.BudgetOwnershipError = exports.BudgetNotFoundError = exports.TransactionOwnershipError = exports.TransactionNotFoundError = exports.InvoiceNotFoundError = exports.ProjectNotFoundError = exports.ProjectOwnershipError = exports.ServiceOwnershipError = exports.ClientOwnershipError = exports.RecurringSeriesOwnershipError = exports.InvoiceOwnershipError = exports.SupplierOwnershipError = exports.IncomeSourceOwnershipError = exports.ContactOwnershipError = exports.CategoryOwnershipError = exports.AccountOwnershipError = exports.AccountNotFoundError = exports.BusinessOwnershipError = exports.BusinessNotFoundError = exports.UserNotFoundError = void 0;
class UserNotFoundError extends Error {
    constructor(message = 'User not found') {
        super(message);
        this.name = 'UserNotFoundError';
    }
}
exports.UserNotFoundError = UserNotFoundError;
class BusinessNotFoundError extends Error {
    constructor(message = 'Business not found') {
        super(message);
        this.name = 'BusinessNotFoundError';
    }
}
exports.BusinessNotFoundError = BusinessNotFoundError;
class BusinessOwnershipError extends Error {
    constructor(message = 'User does not own this business') {
        super(message);
        this.name = 'BusinessOwnershipError';
    }
}
exports.BusinessOwnershipError = BusinessOwnershipError;
class AccountNotFoundError extends Error {
    constructor(message = 'Account not found') {
        super(message);
        this.name = 'AccountNotFoundError';
    }
}
exports.AccountNotFoundError = AccountNotFoundError;
class AccountOwnershipError extends Error {
    constructor(message = 'User does not own this account') {
        super(message);
        this.name = 'AccountOwnershipError';
    }
}
exports.AccountOwnershipError = AccountOwnershipError;
class CategoryOwnershipError extends Error {
    constructor(message = 'User does not own this category') {
        super(message);
        this.name = 'CategoryOwnershipError';
    }
}
exports.CategoryOwnershipError = CategoryOwnershipError;
class ContactOwnershipError extends Error {
    constructor(message = 'User does not own this contact') {
        super(message);
        this.name = 'ContactOwnershipError';
    }
}
exports.ContactOwnershipError = ContactOwnershipError;
class IncomeSourceOwnershipError extends Error {
    constructor(message = 'User does not own this income source') {
        super(message);
        this.name = 'IncomeSourceOwnershipError';
    }
}
exports.IncomeSourceOwnershipError = IncomeSourceOwnershipError;
class SupplierOwnershipError extends Error {
    constructor(message = 'User does not own this supplier') {
        super(message);
        this.name = 'SupplierOwnershipError';
    }
}
exports.SupplierOwnershipError = SupplierOwnershipError;
class InvoiceOwnershipError extends Error {
    constructor(message = 'User does not own this invoice') {
        super(message);
        this.name = 'InvoiceOwnershipError';
    }
}
exports.InvoiceOwnershipError = InvoiceOwnershipError;
class RecurringSeriesOwnershipError extends Error {
    constructor(message = 'User does not own this recurring series') {
        super(message);
        this.name = 'RecurringSeriesOwnershipError';
    }
}
exports.RecurringSeriesOwnershipError = RecurringSeriesOwnershipError;
class ClientOwnershipError extends Error {
    constructor(message = 'User does not own this client') {
        super(message);
        this.name = 'ClientOwnershipError';
    }
}
exports.ClientOwnershipError = ClientOwnershipError;
class ServiceOwnershipError extends Error {
    constructor(message = 'User does not own this service') {
        super(message);
        this.name = 'ServiceOwnershipError';
    }
}
exports.ServiceOwnershipError = ServiceOwnershipError;
class ProjectOwnershipError extends Error {
    constructor(message = 'User does not own this project') {
        super(message);
        this.name = 'ProjectOwnershipError';
    }
}
exports.ProjectOwnershipError = ProjectOwnershipError;
class ProjectNotFoundError extends Error {
    constructor(message = 'Project not found') {
        super(message);
        this.name = 'ProjectNotFoundError';
    }
}
exports.ProjectNotFoundError = ProjectNotFoundError;
class InvoiceNotFoundError extends Error {
    constructor(message = 'Invoice not found') {
        super(message);
        this.name = 'InvoiceNotFoundError';
    }
}
exports.InvoiceNotFoundError = InvoiceNotFoundError;
class TransactionNotFoundError extends Error {
    constructor(message = 'Transaction not found') {
        super(message);
        this.name = 'TransactionNotFoundError';
    }
}
exports.TransactionNotFoundError = TransactionNotFoundError;
class TransactionOwnershipError extends Error {
    constructor(message = 'User does not own this transaction') {
        super(message);
        this.name = 'TransactionOwnershipError';
    }
}
exports.TransactionOwnershipError = TransactionOwnershipError;
class BudgetNotFoundError extends Error {
    constructor(message = 'Budget not found') {
        super(message);
        this.name = 'BudgetNotFoundError';
    }
}
exports.BudgetNotFoundError = BudgetNotFoundError;
class BudgetOwnershipError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'BudgetOwnershipError';
    }
}
exports.BudgetOwnershipError = BudgetOwnershipError;
class ProjectTaskNotFoundError extends Error {
    constructor(message = 'Project task not found') {
        super(message);
        this.name = 'ProjectTaskNotFoundError';
    }
}
exports.ProjectTaskNotFoundError = ProjectTaskNotFoundError;
class ProjectTaskOwnershipError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ProjectTaskOwnershipError';
    }
}
exports.ProjectTaskOwnershipError = ProjectTaskOwnershipError;
