from coaUtils import ChartOfAccounts
from dbUtils import PsDataDocument

# todo:
if __name__ == "__main__":
    classtest1 = PsDataDocument()
    data1 = classtest1.export_account_names_to_json()
    print(data1)

        classtest2 = ChartOfAccounts()
    data2 = classtest2.missing_accounts()
    print(data2)
